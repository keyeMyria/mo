import React, { Component } from 'react'
import { Modal, Form, Input, Radio, Select, Tag, Tooltip, Button, message } from 'antd'
import { connect } from 'dva'
import { createProject, updateProject, getMyProjects, getProjects } from '../../services/project'
import { routerRedux } from 'dva/router'
import _ from 'lodash'

const FormItem = Form.Item
const RadioButton = Radio.Button
const RadioGroup = Radio.Group
const Option = Select.Option

const fields = ['Business', 'Government', 'Education', 'Environment', 'Health', 'Housing & Development',
  'Public Services', 'Social', 'Transportation', 'Science', 'Technology']
const tasks = ['Classification', 'Regression', 'Clustering', 'Reinforcement Learning']
const TYPE = ['app', 'module', 'dataset']
const CAT = ['model', 'toolkit']

class ProjectModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      visible: false,
      privacy: 'private',
      inputVisible: false,
    }
  }

  showModelHandler = (e) => {
    // if (e) e.stopPropagation()
    // this.setState({
    //   visible: true,
    // });
    this.props.dispatch({ type: 'project/showModal' })
  }

  hideModelHandler = () => {
    // if (e) e.stopPropagation()
    // this.setState({
    //   visible: false,
    // });
    this.props.dispatch({ type: 'project/hideModal' })
    this.props.dispatch({ type: 'project/setTags', payload: [] })
  }

  okHandler = () => {
    const { form } = this.props
    form.validateFields((err, values) => {
      const body = {
        ...values,
        tags: this.props.project.tags,
        type: this.props.type,
      }
      if (!err) {
        // TODO move fetch and dispatch to model
        if (this.props.new) {
          const hide = message.loading('Project Creating...', 0)
          createProject({
            body,
            onJson: (response) => {
              this.props.fetchData && this.props.fetchData()
              this.props.dispatch({ type: 'project/hideModal' })
              if(this.props.newAnswer) {
                this.props.handleCreate([response])
              } else {
                this.props.dispatch(routerRedux.push('/workspace/' + response._id + `?type=${this.props.type}`))
              }
              this.props.dispatch({ type: 'project/setTags', payload: [] })
              hide()
            },
          })
        } else {
          updateProject({
            body,
            projectId: this.props.projectDetail.project._id,
            onJson: () => {
              this.props.fetchData && this.props.fetchData()
              this.props.dispatch({ type: 'project/hideModal' })
              this.props.dispatch({
                type: 'projectDetail/fetch',
                projectId: this.props.projectDetail.project._id,
                notStartLab: true,
                projectType: this.props.projectDetail.project.type,
              })
              this.props.dispatch({ type: 'project/setTags', payload: [] })
            },
          })
        }
      }
    })
  }

  onChangePrivacy(e) {
    this.setState({
      privacy: e.target.value,
    })
  }

  handleClose(tags, removedTag) {
    tags = tags.filter(tag => tag !== removedTag).filter(e => e)
    this.setState({ inputValue: undefined })
    this.props.dispatch({ type: 'project/setTags', payload: tags })
  }

  showInput() {
    this.setState({ inputVisible: true })
    // dispatch({ type: 'upload/showInput' })
  }

  handleInputChange(e) {
    this.setState({ inputValue: e.target.value })
    // dispatch({ type: 'upload/setInputValue', payload: e.target.value })
  }

  handleInputConfirm(tags) {
    if (this.state.inputValue && tags.indexOf(this.state.inputValue) === -1) {
      tags = [...tags, this.state.inputValue]
      this.setState({ inputValue: undefined, inputVisible: false })
      this.props.dispatch({ type: 'project/setTags', payload: tags })
    }

    // if (upload.inputValue && upload.tags.indexOf(upload.inputValue) === -1) {
    //   dispatch({ type: 'upload/confirmInput' })
    // }
  }

  render() {
    const { children, projectDetail, project } = this.props
    const { getFieldDecorator } = this.props.form
    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 },
    }
    const url = new URL(location.href.replace('/#', ''))
    const projectType = url.searchParams.get('tab') || url.searchParams.get('type')

    // default values
    const { name, description, category, privacy } = _.get(projectDetail, 'project', {})
    let tags = _.get(project, 'tags', [])

    return (
      <span>
        <span onClick={this.showModelHandler}>
          {children}
        </span>
        <Modal
          title="Project Configuration"
          visible={this.props.project.modalVisible && projectType === this.props.type}
          // type in url === type passed by Projects Component
          onOk={this.okHandler}
          onCancel={this.hideModelHandler}
        >
          <Form layout='horizontal' onSubmit={() => this.okHandler()}>
            <FormItem
              {...formItemLayout}
              label="Project Name"
            >
              {
                getFieldDecorator('name', {
                  initialValue: name,
                  rules: [
                    {
                      required: true,
                    },
                  ],
                })(<Input disabled={!this.props.new}/>)
              }
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="Description"
            >
              {
                getFieldDecorator('description', {
                  initialValue: description,
                  rules: [
                    {
                      required: true,
                    },
                  ],
                })(<Input/>)
              }
            </FormItem>
            {!this.props.new && <FormItem
              {...formItemLayout}
              label="Privacy"
            >
              {getFieldDecorator('privacy', {
                initialValue: privacy,
                rules: [
                  { required: false },
                ],
              })(
                <RadioGroup onChange={(e) => this.onChangePrivacy(e)}>
                  <RadioButton value="private">Private</RadioButton>
                  <RadioButton value="public">Public</RadioButton>
                </RadioGroup>,
              )}

            </FormItem>}
            {this.props.type === 'module' && <FormItem
              {...formItemLayout}
              label="Category"
              help='Models are modules need to be trained,
              and vice versa, toolkits are no need for training.'
            >
              {getFieldDecorator('category', {
                initialValue: category,
                rules: [
                  { required: true },
                ],
              })(
                <Select disabled={!this.props.new}>
                  {
                    CAT.map((e) => <Option value={e} key={e}>{e}</Option>)
                  }
                </Select>,
              )}
            </FormItem>}
            <FormItem
              {...formItemLayout}
              label="Tags"
            >
          {
            getFieldDecorator('tags', {
              initialValue: tags,
              getValueFromEvent: (e) => {
                return [...tags, e.target.value]
              },
              rules: [
                { required: false },
              ],
            })(
              <div>
                {tags.length > 0 && tags.map((tag, index) => {
                  const isLongTag = tag.length > 15
                  const tagElem = (
                    <Tag key={tag} closable={true} afterClose={() => this.handleClose(tags, tag)}>
                      {isLongTag ? `${tag.slice(0, 15)}...` : tag}
                    </Tag>
                  )
                  return isLongTag ? <Tooltip key={tag} title={tag}>{tagElem}</Tooltip> : tagElem
                })}
                {this.state.inputVisible ? (
                  <Input
                    ref={input => input && input.focus()}
                    type="text"
                    size="small"
                    style={{ width: 78 }}
                    value={this.state.inputValue}
                    onChange={(e) => this.handleInputChange(e)}
                    // onBlur={() => this.handleInputConfirm(tags)}
                    onPressEnter={() => this.handleInputConfirm(tags)}
                  />
                ) : <Button size="small" type="dashed" onClick={() => this.showInput()}>+ New Tag</Button>}
              </div>,
            )}
            </FormItem>
          </Form>
        </Modal>
      </span>
    )
  }
}

export default connect(({ project }) => ({ project }))(Form.create()(ProjectModal))
