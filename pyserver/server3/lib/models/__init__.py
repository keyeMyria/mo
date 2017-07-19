# -*- coding: UTF-8 -*-
# keras
from server3.lib.models.keras_seq import KERAS_SEQ_SPEC
from server3.lib.models.keras_seq import keras_seq
from server3.lib.models.keras_seq import keras_seq_to_str
# mlp
from server3.lib.models.mlp import mlp
from server3.lib.models.mlp import MLP
# custom model
from server3.lib.models.custom_model import custom_model
from server3.lib.models.custom_model import custom_model_to_str
## svm
from server3.lib.models.svm import SVM
from server3.lib.models.svm import sdca_model_fn
## kmean
from server3.lib.models.kmean import kmeans_clustering_model_fn
from server3.lib.models.kmean import Kmeans
## linear
from server3.lib.models.linear_classifier import linear_classifier_model_fn
from server3.lib.models.linear_classifier import LinearClassifier
from server3.lib.models.linear_regression import linear_regression_model_fn
from server3.lib.models.linear_regression import LinearRegression

from server3.lib.models.keras_callbacks import MongoModelCheckpoint
