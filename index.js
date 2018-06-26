"use strict"

const request = require('request')
const fs = require('fs')

var stations = []

var bestTrip = {efficiency: 0}
var mostPoints = {points: 0}
const distances = JSON.parse(fs.readFileSync('distances.json'))

//59 and madison : -73.97109243,40.76350532
//58 and madison : -73.97209525108337,40.76302594280519

function getDistance(fromStation, toStation){
  if(distances[fromStation.properties.station_id] && distances[fromStation.properties.station_id][toStation.properties.station_id]){
    return distances[fromStation.properties.station_id][toStation.properties.station_id]
  }
  //for now pythagorean theorem
  let startX = fromStation.geometry.coordinates[0]
  let startY = fromStation.geometry.coordinates[1]
  let endX = toStation.geometry.coordinates[0]
  let endY = toStation.geometry.coordinates[1]
  
  let distanceX = startX - endX
  let distanceY = startY - endY
  
  let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2))
  if(!distances[fromStation.properties.station_id]){
    distances[fromStation.properties.station_id] = []
  }
  distances[fromStation.properties.station_id][toStation.properties.station_id] = distance
  
  return distance
}

function getEfficiency(fromStation, toStation){
  if(fromStation.properties.station_id == toStation.properties.station_id){
    return 0
  }
  let points = getTripPoints(fromStation, toStation)
  if(!points){
    return 0
  }
  let distance = getDistance(fromStation, toStation)
  //console.log(distance)
  //console.log(points)
  return points/distance
}

function getTripPoints(fromStation, toStation){
  if(fromStation.properties.bike_angels_action == 'give' || toStation.properties.bike_angels_action == 'take'){
    //this combo is not eligible
    return 0
  }
  
  return (getPoints(fromStation) + getPoints(toStation)) * getMultiplier(fromStation, toStation) 
}

function getMultiplier(fromStation, toStation){
  //get multiplier for incentived trips
  return 1
}
  
function getPoints(station) {
  if(station.properties.bike_angels_points && station.properties.bike_angels_points != 0){
    return station.properties.bike_angels_points
  } else {
    return 0
  }
}

request('https://layer.bicyclesharing.net/map/v1/nyc/stations', (error, response, body) => {
  let data = JSON.parse(body)
  stations = data.features
  for(var i = 0; i < stations.length; i++){
    let station = stations[i]
    for(var j = 0; j < stations.length; j++){
      let take = stations[i]
      let give = stations[j]
      let efficiency = getEfficiency(take, give)
      if(bestTrip.efficiency < efficiency){
        bestTrip = {efficiency: efficiency, give: give, take: take}
      }
      let points = getTripPoints(take, give)
      if(mostPoints.points < points){
        mostPoints = {points: points, give: give, take: take}
      }
    }
  }
  console.log('Your best bet is to take from ' + bestTrip.take.properties.name + ' and bring it to ' + bestTrip.give.properties.name + ' for a total of ' + (getTripPoints(bestTrip.take, bestTrip.give)) + ' points')
  console.log('Your most points is to take from ' + mostPoints.take.properties.name + ' and bring it to ' + mostPoints.give.properties.name + ' for a total of ' + (mostPoints.points) + ' points')

})