import { appendFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function previewBase(base, number) {
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Neplatné číslo PR.');
  if (!/^\/(?:[a-zA-Z0-9_.-]+\/)*$/.test(base) || base.split('/').some(part => part === '..')) throw new Error('Neplatný Pages base.');
  return `${base}pr-preview/pr-${number}/`;
}

export function selectPreviewRuns(prs, runs, repository) {
  const newest = [...runs].sort((a, b) => b.id - a.id);
  return prs.filter(pr => pr.state === 'open' && pr.head?.repo?.full_name === repository).flatMap(pr => {
    const run = newest.find(run => run.event === 'pull_request' && run.status === 'completed' && run.conclusion === 'success' &&
      run.path === '.github/workflows/pr-preview.yml' && run.head_repository?.full_name === repository && /^[a-f0-9]{40}$/.test(run.head_sha) &&
      (run.pull_requests?.some(item => item.number === pr.number) || (run.head_sha === pr.head.sha && run.head_branch === pr.head.ref)));
    return run ? [{ number: pr.number, title: pr.title, sha: run.head_sha, runId: run.id, current: run.head_sha === pr.head.sha }] : [];
  });
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export function previewListing(manifest, base) {
  const items = manifest.map(item => `<li><a href="${escapeHtml(previewBase(base, item.number))}">PR #${item.number}: ${escapeHtml(item.title)}</a> — ${item.sha.slice(0, 7)}${item.current ? '' : ' (poslední úspěšný build)'}</li>`).join('');
  return `<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>Náhledy PR — Tarot Club</title></head><body><main><h1>Náhledy pull requestů</h1><p><a href="${escapeHtml(base)}">Otevřít hlavní wiki</a></p>${items ? `<ul>${items}</ul>` : '<p>Zatím není dostupný žádný náhled otevřeného PR.</p>'}</main></body></html>`;
}

function client(repository, token) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !token) throw new Error('Chybí přístup k repozitáři.');
  const root = `https://api.github.com/repos/${repository}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' };
  async function request(path, body) {
    const response = await fetch(root + path, { headers, method: body ? 'POST' : 'GET', ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`GitHub API: HTTP ${response.status} (${path.split('?')[0]}).`);
    return response.json();
  }
  async function list(path, key, maxPages = 20) {
    const result = [];
    for (let page = 1; page <= maxPages; page++) {
      const data = await request(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
      const items = key ? data[key] : data;
      result.push(...items);
      if (items.length < 100) return result;
    }
    throw new Error('GitHub API: seznam přesahuje limit stránkování.');
  }
  async function archive(id) {
    if (!Number.isSafeInteger(id)) throw new Error('Neplatný artifact ID.');
    const response = await fetch(`${root}/actions/artifacts/${id}/zip`, { headers, redirect: 'manual', signal: AbortSignal.timeout(30_000) });
    let download = response;
    if ([301, 302, 303, 307].includes(response.status)) {
      const location = new URL(response.headers.get('location'));
      if (location.protocol !== 'https:' || location.username || location.password) throw new Error('Neplatné přesměrování artefaktu.');
      // Signed storage URLs never receive the GitHub Authorization header.
      download = await fetch(location, { signal: AbortSignal.timeout(90_000) });
    }
    if (!download.ok) throw new Error(`Stažení artefaktu: HTTP ${download.status}.`);
    return Buffer.from(await download.arrayBuffer());
  }
  return { request, list, archive };
}

export async function assemble(api, env, root = resolve('dist')) {
  const base = env.BASE_PATH || '/';
  const site = new URL(env.SITE_URL);
  const prefix = previewBase(base, 1).replace('/pr-1/', '/');
  const prs = await api.list('/pulls?state=open');
  const runs = await api.list('/actions/workflows/pr-preview.yml/runs?event=pull_request&status=success', 'workflow_runs');
  const candidates = selectPreviewRuns(prs, runs, env.GITHUB_REPOSITORY);
  const previews = [];
  const staging = resolve(env.RUNNER_TEMP || tmpdir(), 'tarot-pages-previews');
  await mkdir(staging, { recursive: true });
  await rm(resolve(root, 'pr-preview'), { recursive: true, force: true });
  for (const record of candidates) {
    const { artifacts } = await api.request(`/actions/runs/${record.runId}/artifacts`);
    const artifact = artifacts.find(item => item.name === `pr-preview-${record.number}` && !item.expired);
    if (!artifact) continue;
    if (artifact.size_in_bytes > 150 * 1024 * 1024) throw new Error('Příliš velký artefakt náhledu.');
    const path = resolve(staging, `pr-${record.number}.zip`);
    await writeFile(path, await api.archive(artifact.id));
    execFileSync('python3', [fileURLToPath(new URL('./extract-preview.py', import.meta.url)), path, resolve(root, 'pr-preview', `pr-${record.number}`)], { stdio: 'inherit' });
    previews.push({ ...record, url: new URL(previewBase(base, record.number), site).href });
  }
  await mkdir(resolve(root, 'pr-preview'), { recursive: true });
  await writeFile(resolve(root, 'pr-preview/index.html'), previewListing(previews, base));
  const robots = resolve(root, 'robots.txt');
  await appendFile(robots, `Disallow: ${prefix}\n`);
  if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `manifest=${JSON.stringify(previews)}\n`);
  if (env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY, `## Náhledy PR\n\n${previews.map(item => `- [PR #${item.number}](${item.url}) · commit ${item.sha.slice(0, 7)}`).join('\n') || 'Zatím bez sestavených náhledů.'}\n`);
  console.log(`Sestaveno ${previews.length} náhledů vedle produkčního webu z main.`);
}

async function deployments(api, env) {
  const records = JSON.parse(env.PREVIEW_MANIFEST || '[]');
  for (const record of records) {
    const expected = new URL(previewBase(env.BASE_PATH || '/', record.number), env.SITE_URL).href;
    if (record.url !== expected || !/^[a-f0-9]{40}$/.test(record.sha)) throw new Error('Neplatný manifest náhledů.');
    const deployment = await api.request('/deployments', { ref: record.sha, environment: `pr-preview-${record.number}`,
      auto_merge: false, required_contexts: [], transient_environment: true, production_environment: false,
      description: `Náhled PR #${record.number}`, payload: { pull_request: record.number, preview_run_id: record.runId } });
    await api.request(`/deployments/${deployment.id}/statuses`, { state: 'success', environment_url: record.url,
      log_url: `https://github.com/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`, auto_inactive: true });
  }
  if (env.GITHUB_EVENT_NAME === 'pull_request_target' && env.GITHUB_EVENT_PATH) {
    const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8'));
    if (event.action === 'closed') {
      previewBase(env.BASE_PATH || '/', event.number);
      const previous = await api.list(`/deployments?environment=pr-preview-${event.number}`);
      for (const deployment of previous) await api.request(`/deployments/${deployment.id}/statuses`, { state: 'inactive' });
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const api = client(process.env.GITHUB_REPOSITORY, process.env.GITHUB_TOKEN);
  const command = process.argv[2];
  if (command === 'assemble') await assemble(api, process.env);
  else if (command === 'deployments') await deployments(api, process.env);
  else throw new Error('Neznámý příkaz Pages.');
}
