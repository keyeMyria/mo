# -*- coding: UTF-8 -*-
from bson import ObjectId
from flask import Blueprint
from flask import jsonify
from flask import make_response
from flask import request

from server3.service import user_request_comments_service
from server3.utility import json_utility

PREFIX = '/user_request_comments'

user_request_comments_app = Blueprint("user_request_comments_app", __name__,
                                      url_prefix=PREFIX)


@user_request_comments_app.route('', methods=['GET'])
def list_user_request_comments():
    user_request_id = request.args.get("user_request_id")
    user_id = request.args.get("user_ID")
    if user_request_id:
        user_request_comments = user_request_comments_service. \
            get_all_comments_of_this_user_request(user_request_id)
        user_request_comments = json_utility. \
            me_obj_list_to_json_list(user_request_comments)
        return jsonify({'response': user_request_comments}), 200
    elif user_id:
        user_request_comments = user_request_comments_service.\
            list_user_request_comments_by_user_id(user_id)
        user_request_comments = json_utility. \
            me_obj_list_to_json_list(user_request_comments)
        return jsonify({'response': user_request_comments}), 200
    else:
        return jsonify({'response': 'insufficient arguments'}), 400


@user_request_comments_app.route('', methods=['POST'])
def create_user_request_comments():
    print('aha')
    if not request.json \
            or 'comments' not in request.json \
            or 'user_request_id' not in request.json \
            or 'user_id' not in request.json:
        return jsonify({'response': 'insufficient arguments'}), 400
    data = request.get_json()
    comments = data['comments']
    user_id = data['user_id']
    user_request_id = data['user_request_id']
    print('user_request_id')
    print(user_request_id)

    user_request_comments_service.create_user_request_comments(
        user_request_id, user_id, comments)
    return jsonify({'response': 'create user_request_comments success'}), 200


@user_request_comments_app.route('', methods=['PUT'])
def update_user_request_comments():
    user_request_comments_id = request.args.get("user_request_comments_id")
    if not request.json \
            or 'comments' not in request.json \
            or 'user_request_comments_id' not in request.json \
            or 'user_id' not in request.json :
        return jsonify({'response': 'insufficient arguments'}), 400
    data = request.get_json()
    comments = data['comments']
    user_id = data['user_id']
    user_request_comments_service.update_user_request_comments(
        user_request_comments_id, user_id, comments)
    return jsonify({'response': 'update user_request_comments success'}), 200


@user_request_comments_app.route('', methods=['DELETE'])
def remove_user_request_comments():
    user_id = request.args.get('user_ID')
    user_request_comments_id = request.args.get('user_request_comments_id')
    if not user_request_comments_id:
        return jsonify({'response': 'no user_request_comments_id arg'}), 400
    if not user_id:
        return jsonify({'response': 'no user_ID arg'}), 400
    result = user_request_comments_service.remove_user_request_comments_by_id(
        ObjectId(user_request_comments_id), user_id)
    return jsonify({'response': result}), 200