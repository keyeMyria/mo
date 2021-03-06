import request from '../utils/request';

const PREFIX = '/staging_data';

// get stage data sets
export function fetchStagingDatas(project_id) {
  // console.log(`/pyapi${PREFIX}/staging_data_sets?project_id=${project_id}`);

  return request(`/pyapi${PREFIX}/staging_data_sets?project_id=${project_id}&without_result=true`,
    {
      method: 'GET',
      // body: JSON.stringify(values),
    }
  );
}

// fetch stage data field
export function fetchFields(id) {
  return request(`/pyapi${PREFIX}/staging_data_sets/fields?staging_data_set_id=${id}`, {
    method: 'GET'
  })
}

// fetch stage data
export function fetchStagingDataset(id) {
  return request(`/pyapi${PREFIX}/staging_data_sets/${id}?limit=30`, {
    method: 'GET'
  })
}

// save staging data temp for change the staging_data_sets type
// export function saveStagingDataset(payload) {
//   return request(`/pyapi${PREFIX}/staging_data_sets/update_type`, {
//     method: 'PUT',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body:  JSON.stringify({
//       "job_id": payload.id
//     })
//   })
// }
