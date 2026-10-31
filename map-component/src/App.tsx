import './App.css';
import { EUROPE_BOUNDARIES } from './constants';
import EuropeMap from './EuropeMap';
import geojson from './europe.geo.json';

const App = () => {
  return (
    <div>
      <EuropeMap
        boundaries={EUROPE_BOUNDARIES}
        geojson={geojson}
        displayCityName={false}
        onClick={(data) => alert(JSON.stringify(data))}
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
};

export default App;
