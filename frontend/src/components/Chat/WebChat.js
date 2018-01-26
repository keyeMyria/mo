/**
 * 智能机器人对话
 *
 * id 命名规则：
 * {n}_text 文本展示
 * {n}_input 用户输入
 * {n}_select 用户选择
 * {n}_api 后台服务发起
 *
 *
 */

import React, {Component} from 'react'
import ChatBot from 'react-simple-chatbot'
import {Search, UISearch} from './Search'
import {ShowApiDetail, UIShowApiDetail} from './ShowApiDetail'
import Result from './Result'
import Asking from './Asking'
// import {} from '../../constants'
import {ThemeProvider} from 'styled-components'

// 把 props 放到component will mount 的state里可以只在第一次触发的时候出现内容，之后更改props，块可以不刷新

const theme = {
  // background: "red", //'#f5f8fb',
  fontFamily: 'Helvetica Neue',
  headerBgColor: '#EF6C00',
  headerFontColor: '#fff',
  headerFontSize: '15px',
  botBubbleColor: '#EF6C00',
  botFontColor: '#fff',
  userBubbleColor: '#fff',
  userFontColor: '#4a4a4a',
}

export const WebChatId = {
  message: {
    "hello": "hello",
    "desc": "desc",
    "desc1": "desc1",
  },
  functionSelect: {
    text: "functions_text",
    select: "functions_select",
  },

  requirement : {
    text: "requirement_text",
    input: "requirement_input",
    // select: "requirement_select",
    search: "requirement_search",
    api_detail: "api_detail",
    api_result: "api_result",
  },

  asking : {
    text: "asking_text",
    input: "asking_input",
    api: "asking_api",
  },

  failed: {
    requirement_failed_select: "requirement_failed_select",
  }

}

const uiSteps = [
  // api_list
  {
    id: 'search',
    component: <UIShowApiDetail/>,
    waitAction: true,
    // trigger: 'show_api_detail',
    asMessage: true
  },
]

/**
 * 保存 webChat id
 * */

function finalSteps(){

  const start = [
    // introduction text
    {
      id: WebChatId.message.hello,
      message: '你好，欢迎来到MO机器学习平台。',
      trigger: WebChatId.message.desc
    },
    {
      id: WebChatId.message.desc,
      message: 'MO平台将会帮助你轻松的使用机器学习的各种工具。',
      trigger: WebChatId.message.desc1
    },
    {
      id: WebChatId.message.desc1,
      message: '机器人服务现在只支持普通用户（使用服务的非开发者）',
      trigger: WebChatId.functionSelect.text
    },

    // functions select
    {
      id: WebChatId.functionSelect.text,
      message: '请选择下列功能: ',
      trigger: WebChatId.functionSelect.select
    },
    {
      id: WebChatId.functionSelect.select,
      options: [
        {value: 1, label: '使用平台服务', trigger: WebChatId.requirement.text},
        {value: 2, label: '我要提问', trigger: WebChatId.asking.text},

        {value: 3, label: '查看我的收藏', trigger: WebChatId.asking.text},
        {value: 4, label: '查看我的使用历史', trigger: WebChatId.asking.text},
      ],
    },

    // 匹配服务失败时
    {
      id: WebChatId.failed.requirement_failed_select,
      options: [
        {value: 1, label: '重新告知需求', trigger: WebChatId.requirement.text},
        {value: 2, label: '我要提问', trigger: WebChatId.asking.text},
      ],
    },
  ]

  const requirement = [
    {
      id: WebChatId.requirement.text,
      message: '请告诉我你的需求？',
      trigger: WebChatId.requirement.input
    },
    {
      id: WebChatId.requirement.input,
      user: true,
      trigger: WebChatId.requirement.search,
      validator: (value) => {
        if (value.trim() === '') {
          return '输入不能为空'
        }
        return true
      }
    },
    {
      // display api list or go to asking (api list)
      id: WebChatId.requirement.search,
      component: <Search/>,
      waitAction: true,
      asMessage: true
    },
    {
      id: WebChatId.requirement.api_detail,
      component: <ShowApiDetail/>,
      waitAction: true,
      trigger: WebChatId.requirement.api_result,
      asMessage: true
    },
    {
      id: WebChatId.requirement.api_result,
      message: ({ previousValue, steps }) => `result: ${previousValue}`,
      trigger: WebChatId.functionSelect.text,
    },

    // {
    //   id: WebChatId.requirement.api_result,
    //   component: <Result/>,
    //   waitAction: true,
    //   trigger: WebChatId.functionSelect.text,
    //   asMessage: true
    // },
  ]

  const asking = [
    {
      id: WebChatId.asking.text,
      message: '请输入你的问题？',
      trigger: WebChatId.asking.input
    },

    {
      id: WebChatId.asking.input,
      user: true,
      trigger: WebChatId.asking.api,
      validator: (value) => {
        if (value.trim() === '') {
          return '输入不能为空'
        }
        return true
      }
    },

    {
      // 使用提问api
      id: WebChatId.asking.api,
      component: <Asking/>,
      waitAction: true,
      trigger: WebChatId.functionSelect.text,
      asMessage: true
    }
  ]

  return [...start, ...requirement, ...asking]
}



const steps = [
  {
    id: '1',
    message: '请告诉我你的需求？',
    trigger: 'issue'
  },
  {
    id: 'issue',
    user: true,
    trigger: 'search',
    validator: (value) => {
      if (value.trim() === '') {
        return '输入不能为空'
      }
      return true
    }
  },
  {
    id: 'search',
    component: <Search/>,
    waitAction: true,
    // trigger: 'show_api_detail',
    asMessage: true
  },
  {
    id: 'show_api_detail',
    component: <ShowApiDetail/>,
    waitAction: true,
    trigger: 'issue',
    asMessage: true
  },
  {
    id: "show_api_result",
    component: <Result/>,
    waitAction: true,
    trigger: '1',
    asMessage: true
  },

  // {
  //   id: 'does_not_match',
  //   message: "对不起，你的需求未匹配到任何服务",
  //   trigger: 'select',
  // },
  {
    id: 'does_not_match',
    options: [
      {value: 1, label: '重新告知需求', trigger: '1'},
      {value: 2, label: '发起提问', trigger: 'asking'},
    ],
  },

  {
    id: 'asking',
    message: '请输入你的问题？',
    trigger: 'asking_1'
  },

  {
    id: 'asking_1',
    user: true,
    trigger: 'asking_2',
    validator: (value) => {
      if (value.trim() === '') {
        return '输入不能为空'
      }
      return true
    }
  },

  {
    id: "asking_2",
    component: <Asking/>,
    waitAction: true,
    // trigger: 'show_api_detail',
    asMessage: true
  }

]

const testSteps = [
  {
    id: '1',
    message: 'What is your name?',
    trigger: '2',
  },
  {
    id: '2',
    user: true,
    trigger: '3',
  },
  {
    id: '3',
    message: ({previousValue, steps}) => 'Hi {previousValue}, nice to meet you!',
    end: true,
  },
]

class WebChat extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <ThemeProvider theme={theme}>
        <ChatBot
          floating={true}
          headerTitle="MO平台机器人"
          // recognitionEnable={true}
          placeholder="请输入你的问题"
          steps={finalSteps()}
          // steps={uiSteps}
          hideUserAvatar={true}
        />
      </ThemeProvider>
    )
  }
}

export default WebChat
