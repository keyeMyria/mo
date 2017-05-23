
from server.entity.file import File
from server.repository.file_repo import FileRepo

file_repo = FileRepo(File)


def add(file_name, file_size, url, user):
    file_obj = File(name=file_name, size=file_size, path=url, user=user)
    return file_repo.save(file_obj)


def get_by_user(user_obj):
    file_obj = File(user=user_obj)
    return file_repo.read_by_user(file_obj)


def delete_by_object_id(object_id):
    file_obj = File(_id=object_id)
    return file_repo.delete_by_object_id(file_obj)
    # file_obj = file_repo.find_first_one({'_id': object_id})
    # return file_obj.delete()
