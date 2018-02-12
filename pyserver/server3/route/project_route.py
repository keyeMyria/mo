# -*- coding: UTF-8 -*-
"""
Blueprint for project

Author: Zhaofeng Li
Date: 2017.05.24
"""
from bson import ObjectId
from flask import Blueprint
from flask import jsonify
from flask import make_response
from flask import request
from kubernetes import client
from flask_jwt_extended import jwt_required, get_jwt_identity

from server3.service import project_service
from server3.service import ownership_service
from server3.business.project_business import ProjectBusiness
from server3.utility import json_utility
from server3.utility import str_utility
from server3.constants import Error, Warning


PREFIX = '/project'
DEFAULT_CAT = ['model', 'toolkit']

project_app = Blueprint("project_app", __name__, url_prefix=PREFIX)


@project_app.route('', methods=['GET'])
@jwt_required
def list_projects_by_query():
    user_ID = get_jwt_identity
    page_no = int(request.args.get('page_no', 1))
    page_size = int(request.args.get('page_size', 5))
    search_query = request.args.get('search_query', None)
    default_max_score = float(request.args.get('max_score', 0.4))

    try:
        projects = ProjectBusiness.get_objects(
            search_query=search_query,
            user_ID=user_ID,
            page_no=page_no,
            page_size=page_size,
            default_max_score=default_max_score
        )
    except Warning as e:
        return jsonify({
            "response": [],
            "message": e.args[0]["hint_message"]
        }), 200
    except Error as e:
        return jsonify({
            "message": e.args[0]["hint_message"]
        }), 404
    else:
        projects = json_utility.me_obj_list_to_json_list(projects)
        return jsonify({
            "response": projects
        }), 200


@project_app.route('/projects/<string:project_id>', methods=['GET'])
def get_project(project_id):
    if not project_id:
        return jsonify({'response': 'no project_id arg'}), 400
    try:
        project = project_service.get_by_id(project_id)
        project = json_utility.convert_to_json(project.to_mongo())
    except Exception as e:
        return make_response(jsonify({'response': '%s: %s' % (str(
            Exception), e.args)}), 400)
    return make_response(jsonify({'response': project}), 200)


@project_app.route('/projects', methods=['GET'])
def list_projects():
    user_ID = request.args.get('user_ID')
    privacy = request.args.get('privacy')
    others = request.args.get('others')
    if others == 'true':
        projects = ownership_service.get_all_public_projects_of_others(user_ID)
    else:
        projects = project_service. \
            list_projects_by_user_ID(user_ID, -1, privacy=privacy)
    projects = json_utility. \
        me_obj_list_to_json_list(projects)
    return jsonify({'response': projects}), 200


# @project_app.route('/models/<string:user_ID>', methods=['GET'])
# def get_service_of_user(user_ID):
#
#     # 本来从job里取所有的 model，现改为从service中筛自己的
#
#     privacy = request.args.get('privacy')
#     status = 200
#     # categories = request.args.get('categories')
#     projects = project_service.list_projects_by_user_ID(user_ID, -1,
#                                                         privacy=privacy)
#     projects = json_utility.me_obj_list_to_json_list(projects)
#
#     all_models_of_user = {}
#     for each_project in projects:
#         all_models_in_this_project = project_service.get_all_jobs_of_project(
#             each_project['_id'],
#             categories=['model'],
#             status=status)
#         all_models_in_this_project = json_utility.convert_to_json(all_models_in_this_project)
#         all_models_of_user.update(all_models_in_this_project)
#
#     return jsonify({'response': all_models_of_user['model']}), 200


@project_app.route('/jobs/<string:project_id>', methods=['GET'])
def get_jobs_of_project(project_id):
    categories = request.args.get('categories')
    status = request.args.get('status')
    if categories is None:
        categories = DEFAULT_CAT
    else:
        categories = categories.split(',')
    if status is not None:
        status = int(status)

    for c in categories:
        if c not in DEFAULT_CAT:
            raise ValueError('categories arg error')
    history_jobs = project_service.get_all_jobs_of_project(project_id,
                                                           categories,
                                                           status)
    history_jobs = json_utility.convert_to_json(history_jobs)
    return jsonify({'response': history_jobs}), 200


@project_app.route('/fork/<string:project_id>', methods=['POST'])
def project_fork(project_id):
    user_ID = request.args.get('user_ID')
    if not user_ID:
        raise ValueError('no user ID arg')
    new_project = project_service.fork(project_id, user_ID)
    new_project = json_utility.convert_to_json(new_project.to_mongo())
    return jsonify({'response': new_project}), 200


@project_app.route('/publish/<string:project_id>', methods=['PUT'])
def project_publish(project_id):
    update_num = project_service.publish_project(project_id)
    update_num = json_utility.convert_to_json(update_num)
    return jsonify({'response': update_num}), 200


@project_app.route('/unpublish/<string:project_id>', methods=['PUT'])
def project_unpublish(project_id):
    update_num = project_service.unpublish_project(project_id)
    update_num = json_utility.convert_to_json(update_num)
    return jsonify({'response': update_num}), 200


@project_app.route('/projects', methods=['POST'])
@jwt_required
def create_project():
    if not request.json \
            or 'name' not in request.json \
            or 'type' not in request.json \
            or 'is_private' not in request.json:
        return jsonify({'response': 'insufficient arguments'}), 400

    user_token = request.headers.get('Authorization').split()[1]
    user_ID = get_jwt_identity()

    data = request.get_json()
    name = data['name']
    type = data['type']
    description = data['description']
    is_private = str(data['is_private']).lower() == 'true'
    # related_fields = data.get('related_fields', '')
    tags = data.get('tags', '')
    # related_tasks = data.get('related_tasks', '')

    # related_fields = str_utility.split_without_empty(related_fields)
    tags = str_utility.split_without_empty(tags)
    # related_tasks = str_utility.split_without_empty(related_tasks)

    project_service.create_project(name, description, user_ID,
                                   is_private, tags=tags, type=type,
                                   user_token=user_token)
    return jsonify({'response': 'create project success'}), 200


@project_app.route('/projects/<string:project_id>', methods=['PUT'])
def update_project(project_id):
    if not request.json \
            or 'name' not in request.json \
            or 'is_private' not in request.json:
        return jsonify({'response': 'insufficient arguments'}), 400

    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    is_private = data.get('is_private')
    is_private = str(is_private).lower() == 'true'
    related_fields = data.get('related_fields', '')
    tags = data.get('tags', '')
    related_tasks = data.get('related_tasks', '')
    done_indices = data.get('done_indices', [])

    if not isinstance(related_fields, list):
        related_fields = str_utility.split_without_empty(related_fields)
    if not isinstance(tags, list):
        tags = str_utility.split_without_empty(tags)
    if not isinstance(related_tasks, list):
        related_tasks = str_utility.split_without_empty(related_tasks)

    project_service.update_project(project_id, name, description, is_private,
                                   related_fields=related_fields,
                                   tags=tags, related_tasks=related_tasks,
                                   done_indices=done_indices)
    return jsonify({'response': 'create project success'}), 200


@project_app.route('/projects/<string:project_id>', methods=['DELETE'])
def remove_project(project_id):
    user_ID = request.args.get('user_ID')
    if not project_id:
        return jsonify({'response': 'no project_id arg'}), 400
    if not user_ID:
        return jsonify({'response': 'no user_ID arg'}), 400
    result = project_service.remove_project_by_id(ObjectId(project_id),
                                                  user_ID)
    return jsonify({'response': result}), 200


@project_app.route('/playground/<string:project_id>', methods=['POST'])
def start_project_playground(project_id):
    if not project_id:
        return jsonify({'response': 'no project_id arg'}), 400
    try:
        port = project_service.start_project_playground(project_id)
    except client.rest.ApiException as e:
        return jsonify({'response': e.reason}), 400
    return jsonify({'response': port})


@project_app.route('/playground/<string:project_id>', methods=['GET'])
def get_project_playground(project_id):
    if not project_id:
        return jsonify({'response': 'no project_id arg'}), 400
    try:
        port = project_service.get_playground(project_id)
    except client.rest.ApiException as e:
        return jsonify({'response': e.reason}), 400
    return jsonify({'response': port})
