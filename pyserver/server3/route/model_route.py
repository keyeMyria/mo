# -*- coding: UTF-8 -*-
"""
Blueprint for analysis

Author: Zhaofeng Li
Date: 2017.06.30
"""
import re

from bson import ObjectId
from flask import Blueprint
from flask import jsonify
from flask import make_response
from flask import request
from flask import send_from_directory

import server3.service.served_model_service
from server3.service import model_service
from server3.service import staging_data_service
from server3.business import model_business
from server3.business import toolkit_business
from server3.business import staging_data_business
from server3.utility import json_utility
from server3.constants import PORT
from server3.lib.models.nn import neural_style_transfer


PREFIX = '/model'

model_app = Blueprint("model_app", __name__, url_prefix=PREFIX)

ALLOWED_EXTENSIONS = {'py'}
# UPLOAD_URL = '/uploads/'
REQUEST_FILE_NAME = 'uploaded_code'


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@model_app.route('/models/public', methods=['GET'])
def get_all_model_info():
    type = request.args.get('type').lower()
    if type == 'true':
        result = model_service.get_all_public_model_by_type()
    else:
        result = model_service.get_all_public_model()
    return jsonify({'message': 'get info success', 'response':
        json_utility.convert_to_json(result)})


@model_app.route('/models/<string:model_id>', methods=['GET'])
def get_model(model_id):
    try:
        model = model_business.get_by_model_id(ObjectId(model_id))
        model = json_utility.convert_to_json(model.to_mongo())
    except Exception as e:
        return jsonify({'response': '%s: %s' % (str(Exception), e.args)}), 400
    return jsonify({'response': model})


@model_app.route('/models/run/<string:model_id>', methods=['POST'])
def run_model(model_id):
    data = request.get_json()
    conf = data['conf']
    project_id = data['project_id']
    staging_data_set_id = data.get('staging_data_set_id')
    file_id = data.get('file_id')
    schema = data.get('schema')
    divide_row = data.get('divide_row')
    ratio = data.get('ratio')
    # result = model_service.run_model(conf, project_id,
    #                                  staging_data_set_id or file_id,
    #                                  model_id,
    #                                  schema=schema,
    #                                  divide_row=divide_row,
    #                                  ratio=ratio)
    result = model_service.kube_run_model(conf, project_id,
                                          staging_data_set_id or file_id,
                                          model_id,
                                          schema=schema,
                                          divide_row=divide_row,
                                          ratio=ratio)
    result = json_utility.convert_to_json(result)
    return jsonify({'response': result})


@model_app.route('/models/run_multiple/<string:model_id>', methods=['POST'])
def run_multiple_model(model_id):
    data = request.get_json()
    conf = data['conf']
    project_id = data['project_id']
    staging_data_set_id = data['staging_data_set_id']
    schema = data['schema']

    hyper_parameters = data['hyper_parameters']
    result = model_service.run_multiple_model(conf, project_id,
                                              staging_data_set_id, model_id,
                                              schema=schema,
                                              hyper_parameters=hyper_parameters)
    print("result length", len(result))
    return jsonify({'response': result})


# temp test for hyperas model
@model_app.route('/models/run_hyperas_model/<string:model_id>',
                 methods=['POST'])
def run_hyperas_model(model_id):
    data = request.get_json()
    conf = data['conf']
    project_id = data['project_id']
    staging_data_set_id = data['staging_data_set_id']
    schema = data['schema']

    result = model_service.run_hyperas_model(conf, project_id,
                                             staging_data_set_id,
                                             model_id, schema=schema)
    result = json_utility.convert_to_json(result)
    return jsonify({'response': result})


@model_app.route('/models/to_code/<string:model_id>', methods=['POST'])
def model_to_code(model_id):
    data = request.get_json()
    conf = data['conf']
    project_id = data['project_id']
    staging_data_set_id = data.get('staging_data_set_id')
    file_id = data.get('file_id')
    schema = data.get('schema')
    divide_row = data.get('divide_row')
    ratio = data.get('ratio')
    code = model_service.model_to_code(conf, project_id,
                                       staging_data_set_id or file_id,
                                       model_id,
                                       schema=schema,
                                       divide_row=divide_row,
                                       ratio=ratio)
    return jsonify({'response': code})


@model_app.route('/result/<string:job_id>')
def encode_model_result(job_id):
    """
    encode hdf5 weights for keras-js
    :param job_id:
    :return:
    """
    user_ID = request.args.get('user_ID')
    result_dir, h5_filename = model_service.get_results_dir_by_job_id(job_id,
                                                                      user_ID)
    model_service.encode_h5_for_keras_js(result_dir + h5_filename)
    prefix = re.sub('\.hdf5$', '', h5_filename)
    origin = request.remote_addr
    url_base = 'http://{origin}:{port}'.format(origin=origin, port=PORT)
    return jsonify({'response': {
        'model': '{}/model/result/{}/model.json'.format(
            url_base, job_id),
        'weights': '{}/model/result/{}/{}_weights.buf'.format(
            url_base, job_id, prefix),
        'metadata': '{}/model/result/{}/{}_metadata.json'.format(
            url_base, job_id, prefix),
    }})


@model_app.route('/result/<string:job_id>/<filename>')
def model_result(job_id, filename):
    """
    api for get model result file content
    :param job_id:
    :param filename:
    :return:
    """
    user_ID = request.args.get('user_ID')
    result_dir, h5_filename = model_service.get_results_dir_by_job_id(job_id,
                                                                      user_ID)
    return send_from_directory(result_dir, filename)


@model_app.route('/neural_style', methods=['POST'])
def neural_style():
    """
    api for get model result file content
    :return:
    """
    PREFIX = '/file'
    UPLOAD_URL = '/uploads/'
    url_base = PREFIX + UPLOAD_URL

    data = request.get_json()
    urls = data.get('urls')
    user_ID = data.get('user_ID')
    project_id = data.get('project_id')
    file_url = url_base + user_ID + '/'
    save_directory = '/'.join(urls[0].split('/')[:-1]) + '/result'
    args = {
        'base_image_path': urls[0],
        'style_reference_image_path': urls[1],
        'result_prefix': save_directory,
    }
    url = neural_style_transfer.neural_style_transfer(args, project_id,
                                                      file_url)
    return jsonify({'response': url})


# keras model
MODEL_TEMPLATE = {
    "conf": {
        "layers": [
            {
                "name": "Dense",
                "args": {
                    "units": 64,
                    "activation": "relu",
                    "input_shape": [
                        3
                    ]
                }
            },
            {
                "name": "Dropout",
                "args": {
                    "rate": 0.5
                }
            },
            {
                "name": "Dense",
                "args": {
                    "units": 64,
                    "activation": "relu"
                }
            },
            {
                "name": "Dropout",
                "args": {
                    "rate": 0.5
                }
            },
            {
                "name": "Dense",
                "args": {
                    "units": 2,
                    "activation": "softmax"
                }
            }
        ],
        "compile": {
            "args": {
                "loss": "categorical_crossentropy",
                "optimizer": "SGD",
                "metrics": ["accuracy"]
            }
        },
        "fit": {
            "data_fields": [["age", "capital_gain", "education_num"],
                            ["capital_loss", "hours_per_week"]],
            "args": {
                "batch_size": 128,
                "epochs": 20
            }
        },
        "evaluate": {
            "args": {
                "batch_size": 128
            }
        }
    },
    "project_id": "5965e5fae89bde79f3f0e920",
    "staging_data_set_id": "5965cda1d123ab8f604a8dd0",
    "schema": "seq"
}
