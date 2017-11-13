import React from 'react'
import {connect} from 'dva'
import {Select, Button, Card,Icon,Input} from 'antd'
import {showTime} from '../../utils/index'
import {dataCategory} from '../../constants'
import {arrayToJson, JsonToArray} from '../../utils/JsonUtils';
import {routerRedux} from 'dva/router'
import List from '../../components/List/index'

import styles from './index.less'

const Option = Select.Option;
const Search = Input.Search;
const related_fields= ['All',
  'Business', 'Government', 'Education', 'Environment',
  'Health', 'Housing & Development', 'Public Services',
  'Social', 'Transportation', 'Science', 'Technology'];


function MyService({history, myService, dispatch}) {

  const {
    modelsJson,
    focusModel,
    category,
    skipping
  } = myService;

  console.log('myService')
  console.log(myService)

  const props = {
    model: myService,
    namespace: 'myService',
    dispatch: dispatch,
  };

  return(<List {...props}/>)

  const models = JsonToArray(modelsJson);

  function handleChange(value) {
    dispatch({type: 'publicServedModels/fetch',
      payload: {category: value,skipping:0}})
  }

  const onClickMoreModels = () => {
    dispatch({
      type: 'publicServedModels/fetch',
      payload: {category: category,skipping:skipping},
    });
  };

  function toModelDetail(_id, projectId, history) {
    dispatch({type: 'publicServedModels/fetchone',
      payload: {model_ID: _id}})
    // history.push(`/modelmarkets/${id}`)
  }

  function search(value){
    dispatch({
      type: 'publicServedModels/search',
      payload: {searchStr: value},
    });
  }

  return (
    <div className={`main-container ${styles.normal}`}>
      <div className={styles.header}>
        <Select defaultValue="All" className={styles.select}
                onChange={handleChange}>
          {related_fields.map(e =>
            <Option key={e} value={e}>{e}</Option>,
          )}
        </Select>
        <Search
          placeholder="search"
          style={{ width: 200 }}
          onSearch={value => search(value)}
        />
      </div>
      <div className={styles.projectList}>
        {models.map((model, i) =>
          <Card key={model._id} title={model.name} className={styles.card}
                onClick={() => {
                  // toModelDetail(model._id,model.projectId, history)
                  dispatch(routerRedux.push('/modelmarkets/' + model._id))
                  // toModelDetail(model._id,model.projectId, history)
                }}
                style={{cursor: 'pointer'}}>
            <div>
              <p>Description: {model.description}</p>
              <Icon type="user" style={{marginRight: 10}}/>
              {model['user_name'] && <p>{model.user_name}</p>}
              <Icon type="clock-circle-o" style={{marginRight: 10}}/>
              {model['create_time'] && <p>{showTime(model.create_time)}</p>}
              <Icon type="book" style={{marginRight: 10}}/>
              {model['related_tasks'] && <p>{model.related_tasks}</p>}
            </div>
          </Card>)}
        {/*{project.projects.public_projects.map(e => e.name)}*/}
      </div>
      <div>
      <Button type="primary"
              onClick={() => onClickMoreModels()}>More</Button></div>
    </div>
  )
}

export default connect(({myService}) => ({myService}))(MyService)