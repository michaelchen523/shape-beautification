shapes = []
entities = []
currently_selected = null;

var svg = d3.select("svg");

var borderPath = svg.append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("height", 800)
  .attr("width", 1200)
  .style("stroke", "black")
  .style("fill", "none")
  .style("stroke-width", 2);
var line = d3.line()
    .curve(d3.curveBasis);

var svg = d3.select("svg")
    .call(d3.drag()
        .container(function() { return this; })
        .subject(function() { var p = [d3.event.x, d3.event.y]; return [p, p]; })
        .on("start", dragstarted) // is there a better way to call the drag functions here?
        .on('end', classifyCircle));

var form_val;
changeIt(); //instantiate it as draw
function changeIt() {
    var form = document.getElementById("dimensions")
    for(var i=0; i<form.length; i++){
      if(form[i].checked){
        form_val = form[i].id;}}
}

var dataDim = d3.select("#dimensions")
  .on("change", changeIt)

function dragstarted() {
  var d = d3.event.subject,
      active = svg.append("path").datum(d),
      x0 = d3.event.x,
      y0 = d3.event.y;
  shapes.push(d);

  d3.event.on("drag", function() {
    var x1 = d3.event.x,
        y1 = d3.event.y,
        dx = x1 - x0,
        dy = y1 - y0;

    if (dx * dx + dy * dy > 100) d.push([x0 = x1, y0 = y1]);
    else d[d.length - 1] = [x1, y1];
    active.attr("d", line);
  });

}

// function rotateShape(d) {
//     var shape = d3.select(this);
//     var theta = Math.atan2(d3.event.y - height/2, d3.event.x - width/2) * 180 / Math.PI

//     shape
//       .attr("x", d3.event.x)
//       .attr("y", d3.event.y)
//       .attr('transform', `rotate(${theta + 90}, ${d3.event.x}, ${d3.event.y})`)
// })

//TODO: There's a big where you separate and sometimes the index doesn't exist idk
function moveLine(d) {
    var x = d3.event.dx;
    var y = d3.event.dy;
    var line = d3.select(this);
    let temp = line["_groups"][0][0];
    let idx = -1;
    for(let i=0; i < entities.length; i++) {
        for(let j = 0; j < entities[i].length; j++) {
            let curr_line = entities[i][j]
            //Check if it's a circle
            if(curr_line["_groups"] === undefined) {
                console.log(curr_line, entities);
                if(curr_line != temp){
                  continue;
                }
                idx = i;
                break;
            } else {
                let _circle = curr_line["_groups"][0][0];
                if (_circle != temp) {
                    continue;
                }
                idx = i;
                break;
            }
        }
    }
    for(let j = 0; j < entities[idx].length; j++) {
        let curr_shape = entities[idx][j];
        if(curr_shape.x1 === undefined) {
            //This is to check for path vs. circle. Path has length
            if(curr_shape.length === undefined) {
                let circle = curr_shape["_groups"][0][0];
                circle.cx.baseVal.value += x;
                circle.cy.baseVal.value += y;
            } else {
                //TODO: Moving path doesn't work
                for(let l = 0; l < curr_shape.length; l++) {
                    curr_shape[l][0] += x;
                    curr_shape[l][1] += y;
                }
            }
        } else {
            curr_shape.x1.baseVal.value += x;
            curr_shape.y1.baseVal.value += y;
            curr_shape.x2.baseVal.value += x;
            curr_shape.y2.baseVal.value += y;
        }
    }
}

/**
 * Allows lines to get disconnected from each other
 */
//TODO: Only works with lines so far
function separateObject(d) {
    var x = d3.event.dx;
    var y = d3.event.dy;
    _this = this;
    let idx = -1;
    let old_obj = null;
    for(let i = 0; i < entities.length; i++) {
        for(let j = 0; j < entities[i].length; j++) {
            let curr_line = entities[i][j];
            if(curr_line["_groups"] === undefined) {
                if(curr_line === _this){
                  old_obj = curr_line;
                  if(entities[i].length > 1) {
                      let index = entities[i].indexOf(curr_line);
                      if(index !== -1) {
                          entities[i].splice(index, 1)
                      }
                  }
                  break;
                }
            } else {
                let _curr = curr_line["_groups"][0][0]
                if(_curr === this) {
                    old_obj = curr_line;
                    if(entities[i].length > 1) {
                        let index = entities[i].indexOf(curr_line);
                        if(index !== -1) {
                            entities[i].splice(index, 1);
                        }
                    }
                }
            }
        }
    }
    if(old_obj !== null) {
        if(old_obj.x1 !== undefined) {
            old_obj.x1.baseVal.value += 1;
            old_obj.y1.baseVal.value += 1;
            old_obj.x2.baseVal.value += 1;
            old_obj.y2.baseVal.value += 1;
        } else {
            console.log(old_obj)
            let curr
            // old_obj.cx.baseVal.value += 1;
            // old_obj.cy.baseVal.value += 1;
        }
        entities.push([old_obj]);
    }
}
/**
 * Checks whether shape is a circle. If not, calls classifyShape()
 */
function classifyCircle() {

    // if (form_val == 'draw') {
        last_item = shapes[shapes.length - 1];

        dx = last_item[0][0] - last_item[last_item.length - 1][0];
        dy = last_item[0][1] - last_item[last_item.length - 1][1]; //gets distance from itself at start and end

        prox = Math.sqrt(dx*dx + dy*dy);
        circle = false;

        totalPoints = last_item.length;
        averageXLoc = 0;
        averageYLoc = 0;


        for (i = 0; i < last_item.length; i++) {

            x1 = last_item[i][0];
            y1 = last_item[i][1];

            averageXLoc = averageXLoc + x1;
            averageYLoc = averageYLoc + y1;
        }

        averageXLoc = averageXLoc/(last_item.length); //divide by total points except the last one that doesnt get added
        averageYLoc = averageYLoc/(last_item.length);
        //should find the center of the circle --> calc distance from center?????

        averageDistance = 0;

        for (i = 0; i < last_item.length; i++) {
            x1 = last_item[i][0];
            y1 = last_item[i][1];
            averageDistance =  averageDistance + Math.sqrt( Math.pow(x1 - averageXLoc, 2) + Math.pow(y1 - averageYLoc, 2));
        }   //calculates average distance to points (average radius essentially)
        averageDistance = averageDistance / last_item.length;

        lowerBound = averageDistance * .8;
        upperBound = averageDistance * 1.2;

        withinBounds = 0;
        for (i = 0; i < last_item.length; i++) {
            x1 = last_item[i][0];
            y1 = last_item[i][1];
            distance = Math.sqrt(Math.pow(x1 - averageXLoc, 2) + Math.pow(y1 - averageYLoc, 2))
            if (distance > lowerBound && distance < upperBound) {
                withinBounds =  withinBounds + 1;
            }
        }

        if (withinBounds > .8 * last_item.length) {
            circle = true;
            //there would be at least 80% of points within the radius range
        }

        rad = last_item.length * 1.75;
        // if (prox < 25 && circle) {
        if (circle) {

          d3.selectAll("path").filter(function(d, i, list) {
              return i === list.length - 1;
          }).remove();
          var circ = svg.append("circle")
              .attr("cx", averageXLoc) //otherwise wanna shift by above calcs....
              .attr("cy", averageYLoc) //issues if I draw circle over that point....assumes its the top
              //would need to account for starting from left, right, and bottom as well and how to shift....
              .attr('r', averageDistance)
              .attr("stroke-width", 6)
              .attr("stroke", "black")
              .attr('fill', 'none')
              .on("dblclick", separateObject)
              .call(d3.drag()
                  .container(function() { return this; })
                  .subject(function() { var p = [d3.event.x, d3.event.y]; return [p, p]; })
                  .on("drag", moveLine)
                );
          entities.push([circ]);
        } else {
            classifyShape();
        }
      // }
}

function classifyShape() {
    last_item = shapes[shapes.length - 1];
    length = last_item.length; // account for overlap
    bucket_length = Math.floor(length / 3);
    remainder = length % 3;

    first_partition = bucket_length;
    second_partition = bucket_length * 2;

    first_slope = calculateSlope(last_item, 0, first_partition);
    second_slope = calculateSlope(last_item, first_partition, second_partition);
    third_slope = calculateSlope(last_item, second_partition, last_item.length - 1);

    vertical = false;
    if (Math.abs(first_slope) > 1.5 && Math.abs(second_slope) > 1.5 && Math.abs(third_slope) > 1.5) {
      vertical = true;
    }

    if(first_slope == Infinity && second_slope == Infinity && third_slope == Infinity) {
        drawPromiximityLine(last_item);
    } else if (first_slope == -Infinity && second_slope == -Infinity && third_slope == -Infinity) {
        drawPromiximityLine(last_item);
    } else if((Math.abs(first_slope - second_slope) <= 1.25 && Math.abs(first_slope - third_slope) <= 1.25
        && Math.abs(second_slope - third_slope) <= 1.25) || vertical) {



            // ***** the error is with vertical lines, why?
            // the slopes increase much faster as vertical lines, making comparison through subtraction
            // ineffective (ie. a slope of 11 vs 5 doesnt look much different, but fails at algorithm)
            // tried to correct this by saying if the 3 sections are pretty steep, they are vertical and
            // therefore should be beautified, however this doesnt work for all cases, partticularly
            // those with a small, flat slope as a tail somwhere (b/c it wont fulfill the vert condition)
            // *****

        drawPromiximityLine(last_item);
    } else {
       console.log("Not a line");
       console.log(last_item);
       let start = checkProximity(last_item[0][0], last_item[0][1]);
       let end = checkProximity(last_item[last_item.length - 1][0], last_item[last_item.length - 1][1]);
       if (start[2] && end[2]) { //overwrite whole line to both start and end
         entities[start[3]].push(last_item);
       } else if (start[2]) { //overwrite the start to connect
           entities[start[3]].push(last_item);
       } else if (end[2]) { //overwrite the end to connect
           entities[end[3]].push(last_item);
       } else {
           entities.push([last_item]);
       }
    }
}

/**
 * Draws a line that is close
 */
function drawPromiximityLine(last_item) {
  let start = checkProximity(last_item[0][0], last_item[0][1]);
  let end = checkProximity(last_item[last_item.length - 1][0], last_item[last_item.length - 1][1]);
  d3.selectAll("path").filter(function(d, i, list) {
      return i === list.length - 1;
  }).remove();
  if (start[2] && end[2]) { //overwrite whole line to both start and end
    var x = svg.append("line")
        .attr("x1", start[0])
        .attr("y1", start[1])
        .attr('x2', end[0])
        .attr("y2", end[1])
        .attr("stroke-width", 6)
        .attr("stroke", "black")
        .on("dblclick", separateObject)
        .on("click", selectItem)
        .call(d3.drag()
          .container(function() { return this; })
          .subject(function() { var p = [d3.event.x, d3.event.y]; return [p, p]; })
          .on("drag", moveLine)
        );
    entities[start[3]].push(x["_groups"][0][0]);
  } else if (start[2]) { //overwrite the start to connect
      var x = svg.append("line")
          .attr("x1", start[0])
          .attr("y1", start[1])
          .attr('x2', last_item[last_item.length - 1][0])
          .attr("y2", last_item[last_item.length - 1][1])
          .attr("stroke-width", 6)
          .attr("stroke", "black")
          .on("dblclick", separateObject)
          .on("click", selectItem)
          .call(d3.drag()
            .container(function() { return this; })
            .subject(function() { var p = [d3.event.x, d3.event.y]; return [p, p]; })
            .on("drag", moveLine)
          );
      entities[start[3]].push(x["_groups"][0][0]);
  } else if (end[2]) { //overwrite the end to connect
      var x = svg.append("line")
          .attr("x1", last_item[0][0])
          .attr("y1", last_item[0][1])
          .attr('x2', end[0])
          .attr("y2", end[1])
          .attr("stroke-width", 6)
          .attr("stroke", "black")
          .on("dblclick", separateObject)
          .on("click", selectItem)
          .call(d3.drag()
            .container(function() { return this; })
            .subject(function() { var p = [d3.event.x, d3.event.y]; return [p, p]; })
            .on("drag", moveLine)
          );
      entities[end[3]].push(x["_groups"][0][0]);
  } else {
      var x = svg.append("line")
          .attr("x1", last_item[0][0])
          .attr("y1", last_item[0][1])
          .attr('x2', last_item[last_item.length - 1][0])
          .attr("y2", last_item[last_item.length - 1][1])
          .attr("stroke-width", 6)
          .attr("stroke", "black")
          .on("dblclick", separateObject)
          .on("click", selectItem)
          .call(d3.drag()
            .container(function() { return this; })
            .subject(function() { var p = [d3.event.x, d3.event.y]; return [p, p]; })
            .on("drag", moveLine)
          );
      entities.push([x["_groups"][0][0]]);
  }
}

//TODO: uncolor for new selection
function selectItem(d) {
    _this = this;
    if(currently_selected === _this) {
        d3.select(_this)
            .style("stroke", "black");
        currently_selected = null;
    } else {
        currently_selected = _this;
        d3.select(_this)
            .style("stroke", "red");
    }
}

/**
 * Checks whether shapes are close to each other
 */
function checkProximity(x, y) { //should take in a point --> focus on ends and starts of lines
  point = [x, y, false, -1];
  lines = shapes;
  if(entities.length === 0) {
      return point;
  }
  for (let i = 0; i < entities.length; i++) {
      for (let j = 0; j < entities[i].length; j++) {
        let curr = entities[i][j];
        if(curr.x1 == undefined) {
            //This is a conditional to check for circles
            //Since circles aren't arrays?
            if(curr[0] !== undefined) {
              let length = curr.length;
              let startdx = x - curr[0][0];
              let startdy = y - curr[0][1];
              let enddx = x - curr[length - 1][0];
              let enddy = y - curr[length-1[1]];
              let startprox = Math.sqrt(startdx*startdx + startdy*startdy);
              let endprox = Math.sqrt(enddx*enddx + enddy*enddy);
              if (startprox < 25) {  //if somewhat close to each other
                point[0] = curr[0][0];
                point[1] = curr[0][1];
                point[2] = true;
                point[3] = i;
                return point;
              } else if (endprox < 25) {
                point[0] = curr[length - 1][0];
                point[1] = curr[length - 1][1];
                point[2] = true;
                point[3] = i;
                return point;
              }
            } else {
              //It's close to a circle!
              circle = curr["_groups"][0][0];
              console.log("Close to a circle");
              cx = circle.cx.baseVal.value;
              cy = circle.cy.baseVal.value;
              radius = circle.r.baseVal.value;

              theta = calcAngleDegree(x, y, cx, cy);
              newX = cx + radius * Math.cos(theta);
              newY = cy + radius * Math.sin(theta);

              let startdx = x - newX;
              let startdy = y - newY;
              let startprox = Math.sqrt(startdx*startdx + startdy*startdy);
              if (startprox < 25) {  //if somewhat close to each other
                point[0] = newX;
                point[1] = newY;
                point[2] = true;
                point[3] = i;
                return point;
              }
            }
        } else {
            //Connected to another line
            startdx = x - curr.x1.baseVal.value;
            startdy = y - curr.y1.baseVal.value;
            enddx = x - curr.x2.baseVal.value;
            enddy = y - curr.y2.baseVal.value;
            startprox = Math.sqrt(startdx*startdx + startdy*startdy);
            endprox = Math.sqrt(enddx*enddx + enddy*enddy);
            if (startprox < 25) {  //if somewhat close to each other
              point[0] = curr.x1.baseVal.value;
              point[1] = curr.y1.baseVal.value;
              point[2] = true;
              point[3] = i;
              return point;
            } else if (endprox < 25) {
              point[0] = curr.x2.baseVal.value;
              point[1] = curr.y2.baseVal.value;
              point[2] = true;
              point[3] = i;
              return point;
            }
        }
      }
  }
  return point;
  for (i = 0; i < shapes.length - 1; i++) {
    length = shapes[i].length; //gives how many points in the line

    startdx = x - shapes[i][0][0];
    startdy = y - shapes[i][0][1]; //gets the start of the lines x,y coord

    enddx = x - shapes[i][length-1][0];
    enddy = y - shapes[i][length-1][1];

    startprox = Math.sqrt(startdx*startdx + startdy*startdy);
    endprox = Math.sqrt(enddx*enddx + enddy*enddy);

    if (startprox < 25) {  //if somewhat close to each other
      point[0] = shapes[i][0][0];
      point[1] = shapes[i][0][1];
      point[2] = true;
      return point;
      // return [(s[0][0], s[0][1])];
    } else if (endprox < 25) {
      point[0] = shapes[i][length-1][0];
      point[1] = shapes[i][length-1][1];
      point[2] = true;
      return point;
      // return [(s[length-1][0], s[length-1][1])];
    }
  }
  return point;  //leave it where it is otherwise
}

//TODO: Remove from proximity
document.addEventListener("keydown", function(e) {
    keyCode = e.keyCode;
    if(keyCode !== 8) {
        console.log("Not delete");
    } else {
        if(currently_selected !== null) {
          d3.selectAll("line").filter(function(d, i, list) {
              let arr = Array.from(list);
              _temp = arr[i];
              if(currently_selected === _temp) {
                  return true;
              } else {
                  return false;
              }
          }).remove();
        }
      currently_selected = null;
    }
})

//Util function

function calcAngleDegree(x1, y1, x2, y2) {
    return Math.atan2((y1 - y2), (x1 - x2));
}

function calculateSlope(item, first, second) {
  return (item[second][1] - last_item[first][1]) / (last_item[second][0] - last_item[first][0]);
}
