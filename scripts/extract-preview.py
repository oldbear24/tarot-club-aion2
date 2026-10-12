"""Extract static PR data into one preview directory, never into the publisher."""
import re
import stat
import sys
import zipfile
from pathlib import Path, PurePosixPath


def extract_preview(archive, destination):
    destination = Path(destination).resolve()
    with zipfile.ZipFile(archive) as bundle:
        entries = bundle.infolist()
        if len(entries) > 20000 or sum(item.file_size for item in entries) > 300 * 1024 * 1024:
            raise ValueError('Náhled překračuje velikostní limit.')
        names = set()
        for item in entries:
            name = item.filename
            path = PurePosixPath(name)
            mode = item.external_attr >> 16
            if (not name or path.is_absolute() or '\\' in name or '..' in path.parts
                    or re.search(r'[\x00-\x1f]', name) or item.flag_bits & 1
                    or stat.S_IFMT(mode) not in (0, stat.S_IFREG, stat.S_IFDIR)):
                raise ValueError('Neplatná cesta nebo odkaz v náhledu.')
            key = str(path).rstrip('/')
            if key in names:
                raise ValueError('Duplicitní cesta v náhledu.')
            names.add(key)
        if 'index.html' not in names:
            raise ValueError('Náhled neobsahuje kořenový index.html.')
        destination.mkdir(parents=True, exist_ok=True)
        for item in entries:
            target = destination.joinpath(*PurePosixPath(item.filename).parts)
            if item.is_dir():
                target.mkdir(parents=True, exist_ok=True)
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            # Artifact content is never loaded as code by the publisher.
            target.write_bytes(bundle.read(item))
        for page in destination.rglob('*.html'):
            html = page.read_text(encoding='utf-8')
            page.write_text(re.sub(r'(<head\b[^>]*>)',
                                  r'\1<meta name="robots" content="noindex,nofollow">',
                                  html, count=1, flags=re.IGNORECASE), encoding='utf-8')


if __name__ == '__main__':
    extract_preview(sys.argv[1], sys.argv[2])
