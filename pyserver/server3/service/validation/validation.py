

import os
import unittest
from unittest import TextTestRunner
import yaml

class GDValidation(unittest.TestCase):

    MODULE_PATH = "./"
    MODULE_NAME = ""
    MODULE_YAML_OBJ = None

    # Validation Step 1: File / Directory Exist
    def test_src_directory(self):
        '''
            To check the [/src/] direcotary
        :return:
        '''
        self.assertTrue(os.path.isdir(
            "{}/src".format(self.MODULE_PATH)),
            msg="[/src/] directory does not exist")

    def test_src_checkpoint_directory(self):
        '''
            To check the [/src/checkpoint/] direcotary
        :return:
        '''

        self.assertTrue(os.path.isdir(
            "{}/src/checkpoint".format(self.MODULE_PATH)),
            msg="[/src/checkpoint] directory does not exist")

    def test_src_data_directory(self):
        '''
            To check the [/src/data/] direcotary
        :return:
        '''
        self.assertTrue(os.path.isdir(
            "{}/src/data".format(self.MODULE_PATH)),
            msg="[/src/data/] directory does not exist")

    def test_main_file(self):
        '''
            To check the [/src/main.py] file
        :return:
        '''
        self.assertTrue(os.path.exists(
            "{}/src/main.py".format(self.MODULE_PATH)),
            msg="[/src/main.py] does not exist")

    def test_module_spec_file(self):
        '''
            To check the [/src/module_spec.yml] file
        :return:
        '''
        self.assertTrue(os.path.exists(
            "{}/src/module_spec.yml".format(self.MODULE_PATH)),
            msg="[/src/module_sepc.yml] does not exist")

    def test_requirements_file(self):
        '''
            To check the [/requirements.txt] file
        :return:
        '''
        self.assertTrue(os.path.exists(
            "{}/requirements.txt".format(self.MODULE_PATH)),
            msg="[requirements.txt] does not exist")

    # Validation Step 2: YAML
    def test_yaml(self):
        '''
            To check the content of [module_spec.yaml] file
        :return:
        '''


        # Check yml file can be loaded
        with open("{}/src/module_spec.yml".format(self.MODULE_PATH)) as stream:
            try:
                GDValidation.MODULE_YAML_OBJ = yaml.load(stream)
            except Exception as e:
                self.fail(msg="yaml cannot be loaded")

            # Check [input] section
            with self.subTest(name="[input] section"):
                self.assertIsNotNone(
                    GDValidation.MODULE_YAML_OBJ.get("input"),
                    msg="[input] section missing in module_spec.yml")

            with self.subTest(name="[input:predict] section"):
                yaml_input_predict = GDValidation.MODULE_YAML_OBJ.get(
                    "input", {}).get("predict", None)
                self.assertIsNotNone(
                    yaml_input_predict,
                    msg="[input/predict] section missing in module_spec.yml")

            required_predict_items = ["name", "value_type", "range", "type"]
            for k, v in yaml_input_predict.items():
                for item in required_predict_items:
                    with self.subTest(name="[input:predict:{}]".format(k)):
                        self.assertIsNotNone(
                            v.get(item, None),
                            msg="[{}/{}] missing in module_spec.yml".format(
                                k, item))

            # Check [output] section
            with self.subTest(name="[output] section"):
                self.assertIsNotNone(
                    GDValidation.MODULE_YAML_OBJ.get("output"),
                    msg="[output] section missing in module_spec.yml")


    @classmethod
    def run_test(cls, MODULE_PATH, MODULE_NAME):
        GDValidation.MODULE_PATH = MODULE_PATH
        GDValidation.MODULE_NAME = MODULE_NAME

        test_suite = unittest.TestLoader().loadTestsFromTestCase(cls)
        return TextTestRunner().run(test_suite)



if __name__ == '__main__':
    # GDValidation.MODULE_PATH = os.environ.get('MODULE_PATH', GDValidation.MODULE_PATH)
    # GDValidation.MODULE_NAME = os.environ.get('MODULE_NAME', GDValidation.MODULE_NAME)

    # if len(sys.argv) > 1:
    #     GDValidation.MODULE_NAME = sys.argv.pop()
    #     GDValidation.MODULE_PATH = sys.argv.pop()
    # print(GDValidation.MODULE_NAME)
    # print(GDValidation.MODULE_PATH)

    GDValidation.MODULE_PATH = "/Users/Chun/Documents/workspace/goldersgreen/pyserver/user_directory/zhaofengli/sesese"
    GDValidation.MODULE_NAME = "sesese"
    # /Users/Chun/Documents/workspace/goldersgreen/pyserver/user_directory/zhaofengli/sesese
    # unittest.main()

    test_suite = unittest.TestLoader().loadTestsFromTestCase(GDValidation)
    test_result = TextTestRunner().run(test_suite)

    print("total_errors", len(test_result.errors))
    print("total_failures", len(test_result.failures))

    # print("test_result.__dict__", test_result.__dict__)
    # print("test_resultXXX", test_result.failures[0][1])


# import unittest
# from unittest import TextTestRunner
#
# class TestExample(unittest.TestCase):
#
#     def test_pass(self):
#         self.assertEqual(1, 1, 'Expected 1 to equal 1')
#
#     def test_fail(self):
#         self.assertEqual(1, 2, 'uh-oh')
#
# if __name__ == '__main__':
#     test_suite = unittest.TestLoader().loadTestsFromTestCase(TestExample)
#     test_result = TextTestRunner().run(test_suite)
#     print("test_result", test_result.failures[0][1])