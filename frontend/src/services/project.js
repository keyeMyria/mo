
import { request, config } from '../utils';

const { CORS, api } = config
const { projects } = api

// 获取用户所有 projects
export function fetchProjects(payload) {
  return request(`${CORS}${projects}?user_ID=${payload.user_ID}&privacy=${payload.privacy}`);
}

// 获取单个 project
export function fetchProject(payload) {
  return request(`${CORS}${projects}/${payload.projectID}`);
}
