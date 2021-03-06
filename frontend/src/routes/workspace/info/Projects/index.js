import React, { Component } from 'react'
import { connect } from 'dva'
import Joyride from 'react-joyride'
import { Select, Button, Card, Icon, Input, Pagination, Tabs } from 'antd'
import ProjectModel from '../../../../components/ProjectModal/index'
import { showTime } from '../../../../utils/index'
import { privacyChoices, projectChoices } from '../../../../constants'
import { createProject, getProjects, getMyProjects } from '../../../../services/project'

import styles from './index.less'
import blank from './blank.png'

const Option = Select.Option
const Search = Input.Search
const TabPane = Tabs.TabPane

function Projects({ history, project, dispatch, location }) {
  const url = new URL(window.location.href.replace('/#', ''))
  const projectType = url.searchParams.get('tab')
  const search = '?tab='+projectType
  const defaultActiveKeyDic = { '?tab=app': '1', '?tab=module': '2', '?tab=dataset': '3' }
  const paramList = Object.keys(defaultActiveKeyDic)

  function callback(key) {
    history.push(`workspace${paramList[parseInt(key) - 1]}`)
  }

  return (
    <div className={`main-container ${styles.normal}`}>
      <Tabs defaultActiveKey={defaultActiveKeyDic[search]}
            onChange={callback}>
        <TabPane tab="应用" key="1">
          <ProjectList {...{ history, project, dispatch, location }} type='app'/>
        </TabPane>
        <TabPane tab="模块" key="2">
          <ProjectList {...{ history, project, dispatch, location }} type='module'/>
        </TabPane>
        <TabPane tab="数据集" key="3">
          <ProjectList {...{ history, project, dispatch, location }} type='dataset'/>
        </TabPane>
      </Tabs>
    </div>
  )
}

class ProjectList extends Component {
  constructor() {
    super()
    this.state = {
      projects: [],
      projectsLoading: false,
      projectType: 'project',

      query: undefined,
      privacy: undefined,
      totalNumber: 0,
      pageNo: 1,
      pageSize: 5,
      steps:[],
    }
  }

  fetchData({ payload = {} }) {
    const { type } = this.props

    // default filter
    let filter = { type, group: 'my' };

    // get state filter
    ['query', 'privacy', 'page_no', 'page_size'].forEach((key) => {
      filter[key] = this.state[key.dashToHump()]
    })

    // update filter from args
    for (let key in payload) {
      filter[key] = payload[key]
      this.setState({
        [key.dashToHump()]: payload[key],
      })
    }

    // fetch
    getProjects({
      filter,
      onJson: ({ projects, count }) => this.setState({
        projects,
        totalNumber: count,
      }),
    })
  }

  componentDidMount() {
    this.fetchData({})
    // if(this.props.location.search.indexOf("flag")!=-1&&this.props.location.pathname=="/workspace"&&this.props.location.search.indexOf("app")!=-1){
    //   this.setState({
    //     steps:[
    //       {
    //         title: '',
    //         text: '新建应用',
    //         selector: '#Newapp',
    //         position: 'left',
    //         // isFixed:true,
    //         style: {
    //           borderRadius: 0,
    //           color: '#34BFE2',
    //           textAlign: 'center',
    //           width: '29rem',
    //           mainColor: '#ffffff',
    //           backgroundColor:'#ffffff',
    //           beacon: {
    //             inner: '#34BFE2',
    //             outer: '#34BFE2',
    //           },
    //           close:{
    //             display:"none"
    //           }
    //         }
    //       }
    //     ]
    //   })
    // }
    // console.log(this.props.location ,'location')
  }

  handlePrivacyChange(value) {
    this.fetchData({ payload: { privacy: value === 'all' ? undefined : value } })
  }

  handleQueryChange(value) {
    this.fetchData({ payload: { query: value } })
  }

  toProjectDetail(id, history, type) {
    history.push(`/workspace/${id}?type=${type}`)
  }

  onShowSizeChange = (pageNo, pageSize) => {
    this.fetchData({ payload: { page_no: pageNo, page_size: pageSize } })
  }

  render() {
    const { history, project, dispatch } = this.props
    // console.log(document.getElementById("LaunchPage_Contain").scrollTop)
    return (
      <div>
        <Joyride
          ref={c => (this.joyride = c)}
          // callback={this.callback}
          debug={false}
          // disableOverlay={selector === '.card-tickets'}
          locale={{
            back: (<span style={{color:"#34BFE2"}}>Back</span>),
            close: (<span style={{color:"#34BFE2"}}>Close</span>),
            last: (<span style={{color:"#34BFE2"}}>Last</span>),
            next: (<span style={{color:"#34BFE2"}}>Next</span>),
            skip: (<span style={{color:"#666666"}}>Skip</span>),
          }}
          // scrollToSteps  = {true}
          run={true}
          showOverlay={true}
          showSkipButton={true}
          showStepsProgress={true}
          // stepIndex={stepIndex}
          steps={this.state.steps}
          type='continuous'
        />
        <div className={styles.header}>
          <Select defaultValue='all' className={styles.select}
                  onChange={(value) => this.handlePrivacyChange(value)}>
            {privacyChoices.map(e =>
              <Option key={e.value} value={e.value}>{e.text}</Option>,
            )}
          </Select>
          <Search
            placeholder="input search text"
            onSearch={(value) => this.handleQueryChange(value)}
            style={{ width: 200 }}
          />
          <ProjectModel new={true} fetchData={() => this.fetchData({})} type={this.props.type}>
          {
            this.state.projects.length>0?<Button icon='plus-circle-o'  type='primary' className={styles.rightButton} id={`New${this.props.type}`}>New {this.props.type}</Button>:<Button icon='plus-circle-o'  type='primary' className={styles.rightButton} id={`New${this.props.type}`}>Create New</Button>

          }
          </ProjectModel>
        </div>
        {
          this.state.projects.length>0?<div className={styles.projectList}>
          {this.state.projects.map(e =>
            <Card key={e._id} className={styles.card}
                  title={<h3>{e.name}</h3>}
                  extra={e.is_private && <Icon type="lock"/>}
                  onClick={() => this.toProjectDetail(e._id, history, e.type)} style={{ cursor: 'pointer' }}>
              <div>
                <p className={styles.des}>{e.description}</p>
                <p className={styles.other}>
                  <Icon type="clock-circle-o" style={{ marginRight: 10 }}/>
                  {showTime(e.create_time)}
                  <Button style={{ float: 'right' }}
                          onClick={(ev) => {
                            ev.stopPropagation()
                            window.open(`/#/workspace/${e._id}/${e.type}`)
                          }}>
                    Notebook ->
                  </Button>
                </p>
                {/*<Icon type="user" style={{ marginRight: 10 }}/>*/}
                {/*{e['user_name'] && <p>Owner: {e.user_name}</p>}*/}
              </div>
            </Card>)}
          {/*{project.projects.public_projects.map(e => e.name)}*/}
        </div>:<div className={styles.kong}>
                <img src={blank} alt="null" width="200px" height="207px"/>
                <p style={{marginTop:44}}>您还没有创建过任何应用, 点击<span>“新建应用”</span>快速创建。</p>
                <p style={{marginTop:25}}>遇到困难？点击<span>“帮助文档”</span>了解更多。</p>
        </div>
        }
        {
          this.state.projects.length>0?<div className={styles.pagination}>
          <Pagination showSizeChanger
                      onShowSizeChange={this.onShowSizeChange}
                      onChange={this.onShowSizeChange}
                      defaultCurrent={1}
                      defaultPageSize={5}
                      pageSizeOptions={['5', '10', '15', '20', '25']}
                      total={this.state.totalNumber}/>
        </div>:null
        }
      </div>
    )

  }
}


export default connect(({ project }) => ({ project }))(Projects)
