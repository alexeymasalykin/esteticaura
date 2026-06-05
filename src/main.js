import './style.css'
import Experience from './webgl/Experience.js'
import Cursor from './ui/Cursor.js'
import Preloader from './ui/Preloader.js'

const experience = new Experience(document.querySelector('canvas.webgl'))
const cursor = new Cursor()
const preloader = new Preloader(experience)
