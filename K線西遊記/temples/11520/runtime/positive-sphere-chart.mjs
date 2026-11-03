/* K11520 experimental sphere adapter: pure calculations, no network or wallet.
   X = eastward equatorial arc [0,2πR], Y = south-to-north meridian arc [0,πR],
   Z = radial distance from center [0,R]. X/Y are chart arcs, NOT Cartesian distances.
   Existing XZ-ground/Y-height gameplay is intentionally unchanged.
*/
const TAU=2*Math.PI;
const finite=(n,label)=>{if(typeof n!=='number'||!Number.isFinite(n))throw new RangeError(label+'_MUST_BE_FINITE');return n};
export function sphereMetrics(radiusMeters){
 const r=finite(radiusMeters,'RADIUS');if(r<=0)throw new RangeError('RADIUS_MUST_BE_POSITIVE');
 return Object.freeze({radiusMeters:r,circumferenceMeters:TAU*r,crossSectionAreaM2:Math.PI*r*r,surfaceAreaM2:4*Math.PI*r*r,volumeM3:4/3*Math.PI*r*r*r});
}
export function validatePositiveSphere({x,y,z},radiusMeters){
 const {radiusMeters:r,circumferenceMeters:c}=sphereMetrics(radiusMeters);
 const xx=finite(x,'X'),yy=finite(y,'Y'),zz=finite(z,'Z');
 if(xx<0||xx>c||yy<0||yy>Math.PI*r||zz<0||zz>r)throw new RangeError('OUTSIDE_POSITIVE_SPHERE_CHART');
 return {x:xx,y:yy,z:zz};
}
// Approximate spherical lat/lon. Earth logistics need WGS84/terrain geometry.
export function sphereChartToGeo(position,radiusMeters){
 const p=validatePositiveSphere(position,radiusMeters),r=radiusMeters;
 return {latitudeDeg:(p.y/r-Math.PI/2)*180/Math.PI,
 longitudeDeg:(p.x/r-Math.PI)*180/Math.PI,
 radialMeters:p.z,altitudeAboveSphereMeters:p.z-r};
}
export function geoToSphereChart({latitudeDeg,longitudeDeg,radialMeters},radiusMeters){
 const r=sphereMetrics(radiusMeters).radiusMeters,lat=finite(latitudeDeg,'LATITUDE'),lon=finite(longitudeDeg,'LONGITUDE');
 if(lat< -90||lat>90||lon< -180||lon>180)throw new RangeError('INVALID_GEO_ANGLE');
 return validatePositiveSphere({x:(lon+180)*Math.PI/180*r,y:(lat+90)*Math.PI/180*r,z:finite(radialMeters,'RADIAL')},r);
}
export function eastWestCircleAtLatitude(radiusMeters,latitudeDeg){
 const r=sphereMetrics(radiusMeters).radiusMeters,lat=finite(latitudeDeg,'LATITUDE');
 if(lat< -90||lat>90)throw new RangeError('INVALID_GEO_ANGLE');
 return TAU*r*Math.cos(lat*Math.PI/180);
}
