import * as loglevel from 'loglevel'

const level = localStorage.getItem('loglevel:filda')

if (process.env.NODE_ENV === 'development') {
    // loglevel.setLevel(level ? level : 'DEBUG')
    loglevel.setLevel(level ? level : 'WARN')
} else {
    loglevel.setLevel(level ? level : 'WARN')
}

export default loglevel
