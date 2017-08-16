import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import classnames from 'classnames'
import { Button, Select, Icon, message, Modal, Table, Collapse, Spin, Popover } from 'antd'

import { jupyterServer, flaskServer } from '../../../constants'
import Toolkits from '../toolkit/toolSteps'
import JupyterNotebook from './jupyterNotebook'
import Preprocess from '../preprocess/preprocess'
import AutomatedModel from '../model/autoModal'
import Predict from '../predict/predict'
import ImagePredict from '../predict/imagePredict'
import NeuralStyle from '../predict/neuralStyle'
import Serving from '../serving/serving'
import DataPreview from './dataPreview'
import { stepStyle, assetsUrl } from '../../../constants'
import { TourArea } from '../../../components'
import { isEmpty, toolkit_info } from '../../../utils/utils'
import empty from './empty.ipynb'
import style from './detail.css'
// 全局css，在index里去import
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'

const { Panel } = Collapse
const { Option } = Select

const customPanelStyle = {
  background: '#f7f7f7',
  borderRadius: 4,
  marginBottom: 10,
  border: '1px solid #e5e5e5',
};

const defaultSteps = [
  {
    title: 'Choose Data',
    text: <TourArea text='Click to choose your data set to use in this project'
                    src={assetsUrl + '/videos/choose_data.mp4'}/>,
    selector: '[class*="dataChooseButton"]',
    position: 'bottom',
    style: stepStyle,
  },
  {
    title: 'Data Preview Area',
    text: 'After choose your data set, you can have a preview in this area',
    selector: '.data-preview-collapse',
    position: 'bottom',
    style: stepStyle,
  },
  {
    title: 'Preprocess Area',
    text: 'You can do some preprocess for your data set here, such as missing value completion and column filtering',
    selector: '.preprocess-collapse',
    position: 'bottom',
    style: stepStyle,
  },
  {
    title: 'Data Exploration & Analysis Area',
    text: 'You can do some exploration and analysis to have better vision on your data. Feature Selection is also a' +
    ' great feature in this area',
    selector: '.exploration-collapse',
    position: 'top',
    style: stepStyle,
  },
  {
    title: 'Automated Modelling Area',
    text: 'By click you mouse, automated modelling process can be done here, coding is not needed',
    selector: '.model-collapse',
    position: 'top',
    style: stepStyle,
  },
  {
    title: 'Start Notebook',
    text: 'Click to start a jupyter notebook',
    selector: '.notebook-start-button',
    position: 'top',
    style: stepStyle,
  },
]

const columns = [{
  title: '名称',
  dataIndex: 'name',
  key: 'name',
}, {
  title: '描述',
  dataIndex: 'description',
  key: 'description',
}]

class ProjectDetail extends React.Component {
  constructor (props) {
    super(props)
    let name = this.getProjectName()
    this.state = {
      projectName: name,
      fileList: [],
      notebookName: '',
      notebookPath: {},
      editing: false,
      data_id: '',
      start_notebook: false,
      visible: false,
      data_prop: 'owned_ds',
      selectedData: '',
      project_id: this.props.location.query._id,
      dataSet: [],
      dataset_name: 'DataSet Selected',
      to_disconnect: false,
      notebook: empty,
      spawn_new: false,
      columns: [],
      stagingDataID: '',
      loading: false,
    }
  }

  componentDidMount () {
    this.props.dispatch({ type: 'project/query' })
    this.props.dispatch({ type: 'project/listDataSets' })
    this.props.dispatch({ type: 'project/listToolkit' })
    this.props.dispatch({ type: 'project/getStagingDatasets', payload: this.props.location.query._id })
  }

  componentWillUnmount () {
    console.log('disconnect')
    this.setState({ to_disconnect: true })
  }

  runTour (steps) {
    this.props.dispatch({ type: 'app/resetAndRun', payload: steps })
  }

  rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows)
      this.props.dispatch({ type: 'project/selectDataSets', payload: { selectedDSIds: selectedRows[0]._id } })
      this.setState({
        selectedData: selectedRows[0]._id,
        dataset_name: selectedRows[0].name,
        visible: false,
      })
      this.dataOp(selectedRows[0]._id)
    },
  }

  getProjectName () {
    let path = location.pathname
    let temp = path.split('/')
    return temp[2]
  }

  dataOp (dataSetId) {
    if (!dataSetId) {
      return
    }
    this.setState({ loading: true })
    fetch(flaskServer + '/data/data_sets/' + dataSetId + '?limit=5', {
        method: 'get',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ).then((response) => response.json())
      .then((res) => {
        let values = {}
        //console.log('/data/data_sets/'+dataSetId+'?limit=10', res.response)
        Object.keys(res.fields).forEach((e) => values[e] = 'str')
        this.setState({
          dataSet: res.response,
          values,
          fields: res.fields,
          loading: false,
        })
      })
      .catch((err) => console.log('Error: /data/data_sets/', err))
  }

  onChange (info) {
    if (info.file.status !== 'uploading') {
      console.log(info.file, info.fileList)
    }
    if (info.file.status === 'done') {
      console.log('done', info.file.response.response._id)
      this.setState({ data_id: info.file.response.response._id })
      message.success(`${info.file.name} file uploaded successfully`)
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`)
    }
  }

  getNotebook (content) {
    console.log(content)
    for (let i = 0; 0 < content.length; i++) {
      if (content[i] && content[i]['type'] === 'notebook') {
        // console.log(content[i]);
        return content[i]
      }
    }
  }

  startNotebook () {
    fetch(jupyterServer + this.props.project.user.user_ID + '/' + this.state.projectName, {
      method: 'get',
    }).then((response) => response.json())
      .then((res) => {
        console.log(res)
        let notebook_content = {}
        if (res.content && res.content.length !== 0) {
          notebook_content = this.getNotebook(res.content)
        }

        if (isEmpty(notebook_content)) {
          this.setState({
            start_notebook: true,
            notebookName: 'empty',
            spawn_new: true,
          })
        } else {
          fetch(jupyterServer + notebook_content.path, {
            method: 'get',
          }).then((response) => response.json())
            .then((res) => {
              // console.log(notebook_content.name);
              this.setState({
                notebook: res.content,
                notebookName: notebook_content.name,
              }, this.setState({ start_notebook: true }))
            })
        }

      })
  }

  getStagingId (value) {
    //console.log("staged", value);
    fetch(flaskServer + '/staging_data/staging_data_sets/' + value, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => response.json())
      .then((res) => {
          this.setState({
            columns: Object.keys(res.response.data[1]),
            stagingDataID: value,
          })
        },
      )
  }

  onCollapseChange (e) {
    // console.log('click', e)
    // let keys = this.props.project.activeKeys
    // // if (!keys) {
    // //   keys = e[0]
    // // } else {
    // //   keys = undefined
    // // }
    // if(e[0] in keys) {
    //   keys = keys.filter(k => k !== e[0])
    // } else {
    //   e[0] && keys.push(e[0])
    // }
    this.props.dispatch({ type: 'project/setActiveKey', payload: e })
  }

  renderOptions (key) {
    return this.props.project.dataSets[key].map((e) => <Option key={e._id} value={e._id}>{e.name}</Option>)
  }

  render () {
    return (
      <div className="content-inner">
        <div>
          <div>
            <h2>
              {this.state.projectName}
              <Button className={classnames(style.rightCornerButton)}
                      shape="circle" icon="question" onClick={() => this.runTour(defaultSteps)}
              />
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
              <div>
                <Modal title="Choose DataSet"
                       visible={this.state.visible}
                       onOk={() => this.setState({ visible: false })}
                       onCancel={() => this.setState({ visible: false })}
                       footer={null}
                >
                  <Button onClick={() => this.setState({ data_prop: 'owned_ds' })}>PRIVATE</Button>
                  <Button style={{ marginLeft: 10 }}
                          onClick={() => this.setState({ data_prop: 'public_ds' })}>PUBlIC</Button>
                  <Table style={{ marginTop: 10 }}
                         rowSelection={this.rowSelection}
                         dataSource={this.props.project.dataSets[this.state.data_prop]}
                         rowKey={record => record._id}
                         columns={columns}
                  />
                </Modal>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <Button className={classnames(style.dataChooseButton)} type='primary' style={{ width: 120 }}
                          onClick={() => this.setState({ visible: true })}>Choose Data</Button>
                </div>
              </div>
            </div>
          </div>
          <div className='operation-area'>
            <div>
              <Collapse className='data-preview-collapse' bordered={true} style={{ marginTop: 10, width: '100%' }}>
                <Panel className='data-preview-collapse' header={'Stage Data'} key="1">
                  <Spin spinning={this.state.loading}>
                    {this.state.dataSet.length > 0 &&
                    <DataPreview dataSet={this.state.dataSet}
                                 project_id={this.props.location.query._id}/>
                    }
                  </Spin>
                </Panel>
              </Collapse>
            </div>
            <div>
              <Collapse className='preprocess-collapse' bordered={true} style={{ marginTop: 10, width: '100%' }}>
                <Panel header={'Preprocess'} key="1">
                  <Spin spinning={this.state.loading}>
                    <Preprocess dataSet={this.state.dataSet}
                                fields={this.state.fields}
                                project_id={this.props.location.query._id}
                                passStaging={(value) => this.getStagingId(value)}/>
                  </Spin>
                </Panel>
              </Collapse>
            </div>
            <div>
              <Collapse className='exploration-collapse' bordered={true} style={{ marginTop: 10, width: '100%' }}>
                <Panel header={'Data Exploration & Analysis'} key="1">
                  <div className={classnames(style.descriptions)}>
                    <span style={{ fontSize: 14 }}>{'There are currently 5 types of toolkits available: '}</span>
                    {
                      Object.keys(toolkit_info).map((el) =>
                        <div key={el} style={{ marginLeft: 10 }}>
                          <span style={{ fontSize: 14 }}>{el}</span>
                          <Popover content={
                            <div>
                              <p style={{ width: 150 }}>{toolkit_info[el]}</p>
                            </div>
                          } title="Description">
                            <Icon type="question-circle-o" style={{ fontSize: 10, marginLeft: 3, color: '#767676' }}/>
                          </Popover>
                          <span>{', '}</span>
                        </div>)
                    }
                  </div>
                  <Toolkits project_id={this.props.location.query._id}/>
                </Panel>
              </Collapse>
            </div>
            <div>
              <Collapse className='model-collapse' bordered={true} style={{ marginTop: 10, width: '100%' }}>
                <Panel header={'Automated Modelling'} key="1" style={{ width: '100%' }}>
                  <AutomatedModel project_id={this.props.location.query._id} runTour={(steps) => this.runTour(steps)}/>
                </Panel>
              </Collapse>
            </div>
            <Collapse className='model-predict' id="model-predict" bordered={false}
                      style={{ marginTop: 10, width: '100%' }}
                      activeKey={this.props.project.activeKeys}
                      onChange={(e) => this.onCollapseChange(e)}
            >
              <Panel header='Predict' key="5" style={customPanelStyle}>
                {this.props.project.predictModelType === 4 ? <ImagePredict/>
                  : <NeuralStyle project_id={this.state.project_id}/>
                }
              </Panel>
              <Panel header='Serving' key="6" style={customPanelStyle}>
                <Serving/>
              </Panel>
            </Collapse>
          </div>
          <Button className='notebook-start-button' type='primary' style={{ marginTop: 20, width: 120 }}
                  onClick={() => this.startNotebook()}>
            <a href="#notebookSection">
              Start Notebook
            </a>
          </Button>
          <div id="notebookSection">
            {this.state.start_notebook &&
            <JupyterNotebook user_id={this.props.project.user.user_ID}
                             notebook_content={this.state.notebook}
                             notebook_name={this.state.notebookName}
                             project_name={this.state.projectName}
                             project_id={this.state.project_id}
                             dataset_name={this.state.dataset_name}
                             dataset_id={this.state.stagingDataID}
                             spawn_new={this.state.spawn_new}
                             columns={this.state.columns}
            />
            }
          </div>
        </div>
      </div>
    )
  }
}

ProjectDetail.propTypes = {
  toEdit: PropTypes.func,
}

export default connect(({ project }) => ({ project }))(ProjectDetail)
