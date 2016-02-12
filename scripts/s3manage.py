#!/usr/bin/env python



import re
import boto
import sys
import os

import StringIO
import gzip

import mimetypes
mimetypes.init()

BUCKET_NAME = "dummy-geoadmin"

PROFILE_NAME = 'ltbon'


NO_COMPRESS = ['image/png', 'image/jpeg', 'image/ico', 'application/x-font-ttf', 'application/x-font-opentype', 'application/vnd.ms-fontobject', 'application/vnd.ms-fontobject']


mimetypes.add_type('application/x-font-ttf', '.ttf')
mimetypes.add_type('application/x-font-opentype', '.otf')
mimetypes.add_type('application/vnd.ms-fontobject', '.eot')


def _gzip_data(data):

    out = None
    infile = StringIO.StringIO()
    try:
        gzip_file = gzip.GzipFile(fileobj=infile, mode='w', compresslevel=5)
        gzip_file.write(data)
        gzip_file.close()
        infile.seek(0)
        out = infile.getvalue()
    except:
        out = None
    finally:
        infile.close()
    return out


def _unzip_data(compressed):
    inbuffer = StringIO.StringIO(compressed)
    f = gzip.GzipFile(mode='rb', fileobj=inbuffer)
    try:
        data = f.read()
    finally:
        f.close()

    return data


def save_to_s3(src, dest, headers, mimetype=None):

    with open(src, 'r') as f:
        data = f.read()
    if mimetype is None:
        mimetype, _ = mimetypes.guess_type(src)

    _save_to_s3(data, dest, mimetype)


def _save_to_s3(data, dest, mimetype, compress=True):
  
    ziped_data = None
    compressed = False
    content_encoding = None
    headers = {}
    if compress and mimetype not in NO_COMPRESS:

        data = _gzip_data(data)
        content_encoding = 'gzip'
        headers['Content-Encoding'] = 'gzip'
        compressed = True
    else:
        ziped_data = data

    print "Uploading {} - {}, compressed: {}".format(dest, mimetype, compressed)
    try:
        k = boto.s3.key.Key(bucket=bucket)
        k.key = dest
        k.set_metadata('Content-Type', mimetype)
        k.set_metadata('Cache-Control', 'max-age=31536000, public')
        k.content_type = mimetype
        k.size = len(data)
        if compressed:
            k.content_encoding = content_encoding
            k.set_metadata('Content-Encoding', content_encoding)
        else:
            k.content_encoding = None
        k.set_contents_from_string(data, replace=True, policy='public-read')
    except Exception as e:
        print "Error while uploading {}".format(dest)


def get_index_version(c):
    version = None
    p = re.compile(ur'version: \'(\d+)\'')
    match = re.findall(p, c)
    print match
    if len(match) > 0:
        version = match[0]

    return version


s3 = boto.connect_s3(profile_name=PROFILE_NAME)
bucket = s3.get_bucket(BUCKET_NAME)


headers = {}



def usage():
    pass


def upload(VERSION,base_dir):
    FILES = ['prd/lib/build.js', 'prd/style/app.css', 'prd/index.html', 'prd/lib/build.js', 'prd/img', 'prd/style', 'prd/lib', 'prd/locales',
             'prd/cache/layersConfig.de.json', 'prd/cache/layersConfig.fr.json', 'prd/cache/layersConfig.rm.json', 'prd/cache/layersConfig.it.json', 'prd/cache/layersConfig.en.json']

    for fname in FILES:
        fullpath = os.path.join(base_dir, fname)
        if os.path.isfile(fullpath):
            dest = fname.replace('prd', VERSION)
            save_to_s3(fullpath, dest, headers)
        if os.path.isdir(fullpath):
            for (root, dirs, files) in os.walk(fullpath):
                for fn in files:
                    path = os.path.join(root, fn)
                    dest = path.replace('prd', VERSION)
                    save_to_s3(path, dest, headers)

    for n in ('index', 'embed', 'mobile'):
        save_to_s3('prd/{}.html'.format(n), '{}.{}.html'.format(n, VERSION), headers)
    save_to_s3('prd/cache/services', '{}/services'.format(VERSION), headers, mimetype='application/js')

    for lang in ('de', 'fr', 'it', 'rm', 'en'):
        save_to_s3('prd/cache/layersConfig.{}.json'.format(lang), '{}/layersConfig.{}.json'.format(VERSION, lang), headers, mimetype='application/js')

    for k in bucket.list(prefix=VERSION):
        key = bucket.get_key(k.key)
        print key.name, key.content_type, key.content_encoding


def get_active_version():
    k = boto.s3.key.Key(bucket)
    k.key = 'index.html'

    c = k.get_contents_as_string()
    d = _unzip_data(c)

    return get_index_version(d)


def list_version():
    active_version = int(get_active_version())

    indexes = bucket.list(prefix="index")
    p = re.compile(ur'index.(\d+).html')

    for index in indexes:
        match = re.search(p, index.name)
        if match:
            version = int(match.groups()[0])
            print version, version == active_version


def activate(version):
    for n in ('index', 'embed', 'mobile'):
        k = boto.s3.key.Key(bucket)
        src_key_name = '{}.{}.html'.format(n, version)
        print src_key_name
        k.key = src_key_name

        bucket.copy_key(n + '.html', bucket.name, src_key_name, preserve_acl=True)
# -- main---

if len(sys.argv) < 2:
    print "Versin!"
    sys.exit()

if str(sys.argv[1]) == 'upload':
    
    if len(sys.argv) == 3:
        base_dir = os.path.abspath(sys.argv[2])
    else:
        base_dir = os.getcwd()

    with open(os.path.join(base_dir, 'prd/index.html'), 'r') as f:
        ctx = f.read()

    VERSION = get_index_version(ctx)

    response = raw_input("Do you want to upload '{}' from '{}': [y/N]".format(VERSION, base_dir))

    if response != 'y':
        print "Aborting"
        sys.exit()
    upload(VERSION, base_dir)

if str(sys.argv[1]) == 'list':
    list_version()


if str(sys.argv[1]) == 'activate':
    version = int(sys.argv[2])
    print "Activating", version
    activate(version)








