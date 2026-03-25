import request from './request'

export const login = (credentials) => {
  return request({
    url: '/auth/login/',
    method: 'post',
    data: credentials
  })
}

export const register = (userData) => {
  return request({
    url: '/auth/register/',
    method: 'post',
    data: userData
  })
}

export const logout = () => {
  return request({
    url: '/auth/logout/',
    method: 'post'
  })
}