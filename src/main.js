import './style.css'
import Experience from './webgl/Experience.js'
import Cursor from './ui/Cursor.js'
import Preloader from './ui/Preloader.js'
import Nav from './ui/Nav.js'
import BookingForm from './ui/BookingForm.js'
import BeforeAfter from './ui/BeforeAfter.js'

const experience = new Experience(document.querySelector('canvas.webgl'))
const cursor = new Cursor()
const preloader = new Preloader(experience)
const nav = new Nav()
const bookingForm = new BookingForm()
const beforeAfter = new BeforeAfter()
