import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import { assemble, previewBase, previewListing, selectPreviewRuns } from './pages-previews.mjs';

const repository = 'oldbear24/tarot-club-aion2';
const sha = 'a'.repeat(40);
const pr = { number: 2, state: 'open', title: '<img onerror=alert(1)>', head: { sha, ref: 'feature', repo: { full_name: repository } } };
const run = { id: 10, event: 'pull_request', status: 'completed', conclusion: 'success', path: '.github/workflows/pr-preview.yml',
  head_sha: sha, head_branch: 'feature', head_repository: { full_name: repository }, pull_requests: [{ number: 2 }] };

test('preview base respects root/project Pages and rejects unsafe PR numbers', () => {
  assert.equal(previewBase('/', 2), '/pr-preview/pr-2/');
  assert.equal(previewBase('/tarot-club-aion2/', 2), '/tarot-club-aion2/pr-preview/pr-2/');
  for (const value of [0, -1, '2', 2.5]) assert.throws(() => previewBase('/', value));
  for (const base of ['//evil.test/', '/../', '/x/../', 'https://evil.test/']) assert.throws(() => previewBase(base, 2));
});

test('previews select only successful same-repo runs belonging to open PRs', () => {
  assert.equal(selectPreviewRuns([pr], [run], repository)[0].runId, 10);
  assert.equal(selectPreviewRuns([{ ...pr, state: 'closed' }], [run], repository).length, 0);
  for (const patch of [{ conclusion: 'failure' }, { event: 'push' }, { path: '.github/workflows/ci.yml' },
    { head_repository: { full_name: 'outsider/fork' } }, { pull_requests: [{ number: 3 }], head_sha: 'b'.repeat(40) }, { head_sha: 'invalid' }]) {
    assert.equal(selectPreviewRuns([pr], [{ ...run, ...patch }], repository).length, 0);
  }
  const old = { ...run, id: 9, head_sha: 'b'.repeat(40) };
  assert.equal(selectPreviewRuns([pr], [old, run], repository)[0].sha, sha);
  assert.equal(selectPreviewRuns([pr], [old], repository)[0].current, false);
  assert.equal(selectPreviewRuns([pr], [{ ...run, pull_requests: [] }], repository).length, 1);
});

test('preview listing escapes titles and does not expose previews to search indexing', () => {
  const html = previewListing([{ ...pr, sha, current: true }], '/');
  assert.ok(!html.includes('<img'));
  assert.match(html, /&lt;img/);
  assert.match(html, /noindex,nofollow/);
  assert.match(html, /href="\/pr-preview\/pr-2\/"/);
});

test('artifact extraction is confined, rejects traversal/symlinks and adds noindex', async () => {
  const staging = await mkdtemp(resolve(tmpdir(), 'tarot-preview-test-'));
  const zip = resolve(staging, 'preview.zip');
  const target = resolve(staging, 'site', 'pr-preview', 'pr-2');
  const makeZip = name => execFileSync('python3', ['-c', `import zipfile,sys,stat
with zipfile.ZipFile(sys.argv[1],'w') as z:
 z.writestr('index.html','<html><head></head><body>PR</body></html>')
 if sys.argv[2]=='symlink':
  info=zipfile.ZipInfo('link'); info.create_system=3; info.external_attr=(stat.S_IFLNK|0o777)<<16; z.writestr(info,'../../production')
 else: z.writestr(sys.argv[2],'data')`, zip, name]);
  try {
    await writeFile(resolve(staging, 'production'), 'main');
    makeZip('_astro/app.js');
    execFileSync('python3', ['scripts/extract-preview.py', zip, target]);
    assert.match(await readFile(resolve(target, 'index.html'), 'utf8'), /noindex,nofollow/);
    assert.equal(await readFile(resolve(staging, 'production'), 'utf8'), 'main');
    for (const path of ['../../production', '/tmp/escape', 'symlink', 'x\\y']) {
      makeZip(path);
      assert.throws(() => execFileSync('python3', ['scripts/extract-preview.py', zip, target], { stdio: 'pipe' }));
      assert.equal(await readFile(resolve(staging, 'production'), 'utf8'), 'main');
    }
  } finally { await rm(staging, { recursive: true, force: true }); }
});

test('PR builds lack write permissions and publisher checks out only trusted main', async () => {
  const preview = parse(await readFile('.github/workflows/pr-preview.yml', 'utf8'));
  const pages = parse(await readFile('.github/workflows/pages.yml', 'utf8'));
  assert.equal(preview.permissions.contents, 'read');
  assert.ok(!Object.values(preview.permissions).includes('write'));
  assert.ok(preview.on.pull_request.types.includes('synchronize'));
  assert.deepEqual(pages.on.pull_request_target.types, ['closed']);
  for (const job of Object.values(pages.jobs)) {
    const checkout = job.steps.find(step => step.uses?.startsWith('actions/checkout'));
    assert.equal(checkout.with.ref, 'main');
    assert.equal(checkout.with['persist-credentials'], false);
  }
  assert.equal(pages.jobs.deploy.permissions.deployments, 'write');
});

test('publishing retains main and multiple open previews, and removes closed previews', async () => {
  const staging = await mkdtemp(resolve(tmpdir(), 'tarot-pages-assemble-'));
  const root = resolve(staging, 'dist');
  const archive = resolve(staging, 'preview.zip');
  execFileSync('python3', ['-c', `import zipfile,sys,os
os.makedirs(sys.argv[1]+'/pr-preview/pr-9',exist_ok=True)
open(sys.argv[1]+'/index.html','w').write('PRODUCTION')
open(sys.argv[1]+'/robots.txt','w').write('User-agent: *\\nAllow: /wiki/\\n')
open(sys.argv[1]+'/pr-preview/pr-9/index.html','w').write('CLOSED')
with zipfile.ZipFile(sys.argv[2],'w') as z: z.writestr('index.html','<html><head></head><body>PREVIEW</body></html>')`, root, archive]);
  const second = { ...pr, number: 3, title: 'Another PR', head: { ...pr.head, sha: 'b'.repeat(40) } };
  const runs = [run, { ...run, id: 11, head_sha: second.head.sha, pull_requests: [{ number: 3 }] }];
  const api = {
    list: async path => path.startsWith('/pulls') ? [pr, second, { ...pr, number: 9, state: 'closed' }] : runs,
    request: async path => ({ artifacts: [{ name: path.includes('/11/') ? 'pr-preview-3' : 'pr-preview-2', id: 1, expired: false, size_in_bytes: 100 }] }),
    archive: async () => readFile(archive),
  };
  try {
    await assemble(api, { BASE_PATH: '/wiki/', SITE_URL: 'https://wiki.test', GITHUB_REPOSITORY: repository, RUNNER_TEMP: staging }, root);
    assert.equal(await readFile(resolve(root, 'index.html'), 'utf8'), 'PRODUCTION');
    for (const number of [2, 3]) assert.match(await readFile(resolve(root, `pr-preview/pr-${number}/index.html`), 'utf8'), /PREVIEW/);
    await assert.rejects(readFile(resolve(root, 'pr-preview/pr-9/index.html')));
    assert.match(await readFile(resolve(root, 'robots.txt'), 'utf8'), /Disallow: \/wiki\/pr-preview\//);
    const listing = await readFile(resolve(root, 'pr-preview/index.html'), 'utf8');
    assert.match(listing, /\/wiki\/pr-preview\/pr-2\//);
    assert.match(listing, /\/wiki\/pr-preview\/pr-3\//);
  } finally { await rm(staging, { recursive: true, force: true }); }
});
