import os
import csv

from business import file_business
from business import user_business
from business import ownership_business
from repository import config

UPLOAD_FOLDER = config.get_file_prop('UPLOAD_FOLDER')


def add_file(file, url_base, user_ID, if_private=True):
    if not user_ID:
        raise ValueError('no user id or private input')
    user = user_business.get_by_user_ID(user_ID)
    if not user:
        raise NameError('no user found')
    file_url = url_base + user.user_ID + '/' + file.filename
    save_directory = UPLOAD_FOLDER + user.user_ID + '/'
    file_size, file_path = save_file_and_get_size(file, save_directory)
    saved_file = file_business.add(file.filename, file_size, file_url,
                                   file_path)
    if saved_file:
        if not ownership_business.add(user, bool(if_private), file=saved_file):
            # revert file saving
            file_business.delete_by_object_id(saved_file['_id'])
            raise RuntimeError('ownership create failed')
        else:
            return file_url
    else:
        raise RuntimeError('file create failed')


def list_files_by_user(user):
    return file_business.list_by_user(user)


#######################################################################
# local file management

def save_file_and_get_size(file, path):
    if not os.path.exists(path):
        os.makedirs(path)
    file.save(os.path.join(path, file.filename))
    return os.stat(os.path.join(path)).st_size, path + file.filename


# get file
def file_loader(object_id):
    file = file_business.get_by_object_id(object_id)
    with open(file.path) as csv_data:
        reader = csv.reader(csv_data)

        # eliminate blank rows if they exist
        rows = [row for row in reader if row]
        headings = rows[0]  # get headings

        table = []
        for row in rows[1:]:
            row_data = {}
            for col_header, data_column in zip(headings, row):
                row_data[col_header] = data_column
            table.append(row_data)
    return table
