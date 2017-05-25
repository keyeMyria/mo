#!/usr/bin/python
# -*- coding: UTF-8 -*-
"""
# @author   : Tianyi Zhang
# @version  : 1.0
# @date     : 2017-05-23 11:00pm
# @function : Getting all of the toolkit of statics analysis
# @running  : python
# Further to FIXME of None
"""

# import numpy as np
import pandas as pd
# from bson import ObjectId

from entity.toolkit import Toolkit
from repository.toolkit_repo import ToolkitRepo
from business import user_business, ownership_business

toolkit_repo = ToolkitRepo(Toolkit)


def get_by_toolkit_name(toolkit_name):
    toolkit_obj = Toolkit(name=toolkit_name)
    # print 'toolkit_obj', toolkit_obj.name
    return toolkit_repo.read_by_toolkit_name(toolkit_obj)


def get_by_toolkit_id(toolkit_id):
    toolkit_obj = Toolkit(id=toolkit_id)
    # print 'toolkit_obj', toolkit_obj.name
    return toolkit_repo.read_by_id(toolkit_obj)


def list_public_toolkit_name():
    # toolkit_obj = Toolkit()
    all_names = []
    # print 'toolkit_obj', toolkit_obj.name
    for tool in get_all_public_toolkit():
        all_names.append(tool.toolkit.name)
    return all_names


def get_all_public_toolkit():
    return ownership_business.list_ownership_by_type_and_private('toolkit', False)


def create_public_toolkit():
    """
    数据库建一个toolkit的collection, 记载public的数据分析工具包简介
    """
    user = user_business.get_by_user_ID('tttt') # fixme

    AVG = Toolkit(name='平均值',
                  description='计算所选数据集合的平均值',
                  parameter_spec={'input_data': 'list'})
    AVG = toolkit_repo.create(AVG)
    ownership_business.add(user, False, toolkit=AVG)

    MEDIAN = Toolkit(name='中位数',
                     description='计算所选数据集合的中位数',
                     parameter_spec={'input_data': 'list'})
    MEDIAN = toolkit_repo.create(MEDIAN)
    ownership_business.add(user, False, toolkit=MEDIAN)

    MODE = Toolkit(name='众数',
                   description='计算所选数据集合的众数',
                   parameter_spec={'input_data': 'list'})
    MODE = toolkit_repo.create(MODE)
    ownership_business.add(user, False, toolkit=MODE)

    SMA = Toolkit(name='移动平均值',
                  description='计算所选数据集合的移动平均值',
                  parameter_spec={'input_data': 'list',
                                  'window': 3})
    SMA = toolkit_repo.create(SMA)
    ownership_business.add(user, False, toolkit=SMA)

    RANGE = Toolkit(name='全距',
                    description='计算所选数据集合的最大/最小值之差',
                    parameter_spec={'input_data': 'list'})
    RANGE = toolkit_repo.create(RANGE)
    ownership_business.add(user, False, toolkit=RANGE)

    STD = Toolkit(name='标准差',
                  description='计算所选数据集合的标准差',
                  parameter_spec={'input_data': 'list'})
    STD = toolkit_repo.create(STD)
    ownership_business.add(user, False, toolkit=STD)

    VAR = Toolkit(name='方差',
                  description='计算所选数据集合的方差',
                  parameter_spec={'input_data': 'list'})
    VAR = toolkit_repo.create(VAR)
    ownership_business.add(user, False, toolkit=VAR)

    PEARSON = Toolkit(name='皮尔森相关系数',
                      description='计算所选数据集合的皮尔森相关系数, 表达两变量之间(线性)相关系数',
                      parameter_spec={'input_data0': 'list',
                                      'input_data1': 'list'})
    PEARSON = toolkit_repo.create(PEARSON)
    ownership_business.add(user, False, toolkit=PEARSON)

    KMEAN = Toolkit(name='K平均数算法',
                    description='计算所选数据集合的k-mean, 把一个把数据空间划分为k个子集',
                    parameter_spec={'input_data': 'list',
                                    'k': 2})
    KMEAN = toolkit_repo.create(KMEAN)
    ownership_business.add(user, False, toolkit=KMEAN)

    MIC = Toolkit(name='最大互信息数',
                  description='计算所选数据集合的最大互信息数, 表达两变量之间(函数关系)相关系数',
                  parameter_spec={'input_data0': 'list',
                                  'input_data1': 'list'})
    MIC = toolkit_repo.create(MIC)
    ownership_business.add(user, False, toolkit=MIC)



def convert_json_str_to_dataframe(arr):
    """
    convert input data:
    from
        data from staging data => database_type like, which is a list of dicts
    to
        DataFrame in pandas
    """
    col = arr[0].keys()
    df_converted = pd.DataFrame([[i[j] for j in col] for i in arr],
                                columns=col)
    return df_converted

if __name__ == '__main__':
    # pass
