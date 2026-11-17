import jelly from '../assets/jelly.webp'
import fishA from '../assets/fish-1.webp'
import fishB from '../assets/fish-3.webp'
import fishC from '../assets/fish-5.webp'
import fishD from '../assets/fish-6.webp'
import '../styles/decor.css'

export function Decor() {
  return (
    <div className="decor" aria-hidden="true">
      <div className="decor-rays">
        <span /><span /><span /><span />
      </div>
      <div className="decor-caustics" />
      <img className="decor-jelly decor-jelly-left" src={jelly} alt="" />
      <img className="decor-jelly decor-jelly-right" src={jelly} alt="" />
      <div className="decor-swim decor-swim-a"><img src={fishA} alt="" /></div>
      <div className="decor-swim decor-swim-b"><img src={fishB} alt="" /></div>
      <div className="decor-swim decor-swim-c"><img src={fishC} alt="" /></div>
      <div className="decor-swim decor-swim-d"><img src={fishD} alt="" /></div>
      <div className="decor-plankton">
        <span className="decor-plankton-layer decor-plankton-pink" />
        <span className="decor-plankton-layer decor-plankton-cyan" />
        <span className="decor-plankton-layer decor-plankton-green" />
      </div>
    </div>
  )
}
