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


def save_to_s3(src, dest, cached=True, mimetype=None):
    
    with open(src, 'r') as f:
        data = f.read()
    if mimetype is None:
        mimetype, _ = mimetypes.guess_type(src)

    _save_to_s3(data, dest, mimetype, cached=cached)


def _save_to_s3(in_data, dest, mimetype, compress=True, cached=True):
    
    data = in_data
    compressed = False
    content_encoding = None
    cache_control =  'max-age=31536000, public'

    if compress and mimetype not in NO_COMPRESS:

        data = _gzip_data(in_data)
        content_encoding = 'gzip'
        compressed = True
        

    print "Uploading {} - {}, compressed: {}, cached: {}".format(dest, mimetype, compressed, cached)
    if cached is False:
        cache_control = 'no-cache, no-store, max-age=0, must-revalidate'

    
    
    try:
        k = boto.s3.key.Key(bucket=bucket)
        k.key = dest
        k.set_metadata('Content-Type', mimetype)
        k.content_type = mimetype
        k.set_metadata('Cache-Control',cache_control)
        k.cache_control = cache_control
        k.content_type = mimetype
        k.size = len(data)
        if compressed:
            k.content_encoding = content_encoding
            k.set_metadata('Content-Encoding', content_encoding)
        if cached is False:
            k.set_metadata('Expires', 'Fri, 01 Jan 1990 00:00:00 GMT')
        else:
            k.content_encoding = None
        k.set_contents_from_string(data, replace=True, policy='public-read')
    except Exception as e:
        print "Error while uploading {}: {}".format(dest,e)


def get_index_version(c):
    version = None
    p = re.compile(ur'version: \'(\d+)\'')
    match = re.findall(p, c)
    print match
    if len(match) > 0:
        version = int(match[0])

    return version


s3 = boto.connect_s3(profile_name=PROFILE_NAME)
bucket = s3.get_bucket(BUCKET_NAME)


headers = {}



def usage():
    print "\nManage map.geo.admin.ch versions in AWS S3 bucket\n"
    print 'Usage: '+ os.path.basename(sys.argv[0]) + ' <command> [option]'
    print
    print "Commands:"
    print
    print "  list"
    print "     list available <version> in bucket"
    print
    print "  upload [dir]"
    print "      upload content of /prd directory to bucket. You may specify a directory (default to current)."
    print "      Active project is NOT changed. Project has to be statified (post PR https://github.com/geoadmin/mf-geoadmin3/pull/3078)"
    print
    print "  activate"
    print "      activate the given 'version' (copy from <version>/index.<version>.html to index.html"


def upload(version, base_dir):
    FILES = ['prd/lib/build.js', 
             'prd/style/app.css', 
             'prd/index.html', 
             'prd/lib/build.js', 
             'prd/img', 
             'prd/style',
             'prd/lib', 
             'prd/locales'
             ]
    
    VERSION = str(version)
    
   

    for fname in FILES:
        fullpath = os.path.join(base_dir, fname)
        if os.path.isfile(fullpath):
            dest = fname.replace('prd', VERSION)
            save_to_s3(fullpath, dest, cached=True)
        if os.path.isdir(fullpath):
            print fullpath
            for (root, dirs, files) in os.walk(fullpath):
                for fn in files:
                    path = os.path.join(root, fn)
                    relpath = os.path.relpath(path, os.path.commonprefix([base_dir, path])) 
                    dest = relpath.replace('prd', VERSION)
                    save_to_s3(path, dest, cached=True)

    for n in ('index', 'embed', 'mobile'):
        save_to_s3('prd/{}.html'.format(n), '{}.{}.html'.format(n, VERSION), cached=False)
        
    save_to_s3('prd/cache/services', '{}/services'.format(VERSION), cached=True, mimetype='application/js')

    for lang in ('de', 'fr', 'it', 'rm', 'en'):
        save_to_s3('prd/cache/layersConfig.{}.json'.format(lang), '{}/layersConfig.{}.json'.format(VERSION, lang), cached=True, mimetype='application/js')

      
    save_to_s3('prd/geoadmin.appcache', '{}/geoadmin.appcache'.format(VERSION), cached=False, mimetype='text/cache-manifest')
    save_to_s3('prd/robots.txt', '{}/robots.txt'.format(VERSION), cached=False, mimetype='text/plain')
    save_to_s3('prd/checker', '{}/checker'.format(VERSION), cached=False, mimetype='text/plain')
    
    print("Please check it on '{}'".format(get_url("index.{}.html".format(VERSION))))


def get_active_version():
    k = boto.s3.key.Key(bucket)
    k.key = 'index.html'
    try:
        c = k.get_contents_as_string()
        d = _unzip_data(c)
    except boto.exception.S3ResponseError as e:
        return 0

    return int(get_index_version(d))

def version_exists(version):
    files = bucket.list(prefix=str(version))
    
    return len(list(files)) > 0
    
    
    

def list_version():
    active_version = int(get_active_version())

    indexes = bucket.list(prefix="index")
    p = re.compile(ur'index.(\d+).html')

    for index in indexes:
        match = re.search(p, index.name)
        if match:
            version = int(match.groups()[0])
            print version, index.last_modified, version == active_version

def delete_version(version):
    if version_exists(version) is False:
        print("Version '{}' does not exists in AWS S3. Aborting".format(version))        
        sys.exit(2)
        
    if version == get_active_version():
        print("Version '{}' is the active version. You cannot delete it".format(version))
        sys.exit()
        
   
    result_set = bucket.list(prefix=str(version))
    
    indexes = [k.name for k in list(result_set)]
    for n in ('index', 'embed', 'mobile'):
        k = boto.s3.key.Key(bucket)
        src_key_name = '{}.{}.html'.format(n, version)
        indexes.append(src_key_name)
        
    result_set = bucket.delete_keys(indexes)
        
    for v in result_set.deleted:
        print v
        
        

def activate(version):
    if version_exists(version) is False:
        print("Version '{}' does not exists in AWS S3. Aborting".format(version))        
        sys.exit(2)
        
    if version == get_active_version():
        print("Version '{}' is already the active version. Doing nothing".format(version))
        sys.exit()
        
    for n in ('index', 'embed', 'mobile'):
        k = boto.s3.key.Key(bucket)
        src_key_name = '{}.{}.html'.format(n, version)
        print src_key_name
        k.key = src_key_name

        bucket.copy_key(n + '.html', bucket.name, src_key_name, preserve_acl=True)
    for j in ('robots.txt', 'geoadmin.appcache', 'checker'):
        src_key_name = '{}/{}'.format( version, j)
        bucket.copy_key(os.path.basename(src_key_name), bucket.name, src_key_name, preserve_acl=True)
        
        
    print("Please check it on '{}'".format(get_url()))


def get_url(key_name='index.html'):
    http_url = 'http://{bucket}.{host}/{key}'.format(
        host=s3.server_name(),
        bucket=bucket.name,
        key=key_name)
    
    return http_url


def main():
    get_url()
    if len(sys.argv) < 2:
        usage()
        sys.exit()

    if str(sys.argv[1]) == 'upload':
        
        if len(sys.argv) == 3:
            base_dir = os.path.abspath(sys.argv[2])
        else:
            base_dir = os.getcwd()
    
        with open(os.path.join(base_dir, 'prd/index.html'), 'r') as f:
            ctx = f.read()
    
        VERSION = get_index_version(ctx)
        
        active_version = get_active_version()
        
        if VERSION == active_version:
            response = raw_input("WARNING!!!\nVersion {} is the active one!!!\nDo you really want to upload it from '{}'?: [y/N]".format(VERSION, base_dir))
        else:
            if version_exists(VERSION) is False:
                response = raw_input("Do you want to upload version '{}' from '{}'?: [y/N]".format(VERSION, base_dir))
            else:
                response = raw_input("Version '{}' already exists in AWS S3. Do you really want to overwrite it with files from '{}'?: [y/N]".format(VERSION, base_dir))
    
        if response != 'y':
            print "Aborting"
            sys.exit()
        upload(VERSION, base_dir)
    
    if str(sys.argv[1]) == 'list':
        list_version()
    
    
    if str(sys.argv[1]) == 'activate' and len(sys.argv) == 3:
        version = int(sys.argv[2])
        print("Trying to activate version '{}'".format(version))
        activate(version)

    if str(sys.argv[1]) == 'delete' and len(sys.argv) == 3:
        version = int(sys.argv[2])
        print("Trying to delete version '{}'".format(version))
        delete_version(version)   

if __name__ == '__main__':
    main()






