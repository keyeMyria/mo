#!/usr/bin/python
# -*- coding: UTF-8 -*-
"""
# @author   : Tianyi Zhang
# @version  : 1.0
# @date     : 2017-05-23 11:00pm
# @function : Getting all of the model of statics analysis
# @running  : python
# Further to FIXME of None
"""

from service import job_service
from business import model_business, ownership_business, user_business
from utility import json_utility
from lib.models import keras_seq
from service import controller


def get_all_public_model():
    models = [obj.model.to_mongo().to_dict() for obj in ownership_business.
              list_ownership_by_type_and_private('model', False)]
    print('models', len(models))
    return models


def list_public_model_name():
    all_names = []
    for tool in get_all_public_model():
        all_names.append(tool.model.name)
    return all_names


def add_model_with_ownership(user_ID, is_private, name, description, category,
                             target_py_code, entry_function,
                             to_code_function, parameter_spec, input):
    model = model_business.add(name, description, category,
                               target_py_code, entry_function,
                               to_code_function, parameter_spec, input)
    user = user_business.get_by_user_ID(user_ID)
    ownership_business.add(user, is_private, model=model)
    return model


def run_model(conf, project_id, staging_data_set_id, model_id, **kwargs):
    """
    run model by model_id and the parameter config

    :param conf:
    :param project_id:
    :param staging_data_set_id:
    :param model_id:
    :param kwargs:
    :return:
    """
    job_service.run_code(conf, project_id, staging_data_set_id, model_id,
                         **kwargs)
    # controller.run_code(conf, model)


def model_to_code(conf, project_id, staging_data_set_id, model_id, **kwargs):
    """
    run model by model_id and the parameter config

    :param conf:
    :param project_id:
    :param staging_data_set_id:
    :param model_id:
    :param kwargs:
    :return:
    """
    return job_service.to_code(conf, project_id, staging_data_set_id, model_id,
                               **kwargs)
    # controller.run_code(conf, model)


def temp():
    add_model_with_ownership(
        'system',
        False,
        'keras_seq',
        'keras_seq from keras',
        0,
        '/lib/keras_seq',
        'keras_seq',
        'keras_seq_to_str',
        keras_seq.KERAS_SEQ_SPEC,
        {'type': 'ndarray', 'n': None}
    )

if __name__ == '__main__':
    pass
    # temp()
