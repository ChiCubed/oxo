var canvas, ctx = null;
var gridSize = {width: 10, height: 10};
var images = null, grid = [];
var mousePos = null, newObjectPos = null;
var currentType = null;
var laserSources = [
	{pos: {x: -1, y: 0}, dir: {x: 1, y: 0}}
];

function drawGrid(cellSize) {
	ctx.lineWidth = 2;
	ctx.strokeStyle = "grey";

	ctx.beginPath();
	for (var i = 0; i < canvas.width; i += cellSize.width) {
		for (var j = 0; j < canvas.height; j += cellSize.height) {
			ctx.strokeRect(
				i, j,
				cellSize.width,
				cellSize.height
			);
		}
	}
	ctx.closePath();
}

function drawImage(cellSize, pos, type) {
	if (images === null) return;

	var isVert = ['circle', 'cross', 'square'].includes(type);
	var smult = isVert?2:1;
	ctx.drawImage(
		images[type],
		pos.x*cellSize.width,
		pos.y*cellSize.height,
		cellSize.width*smult,
		cellSize.height*smult
	);
}

function drawTiles(cellSize, tiles) {
	for (var i = 0; i < tiles.length; ++i) {
		drawImage(
			cellSize, tiles[i].pos,
			tiles[i].tile
		);
	}
}

function calcTiles(laserSource) {
	var tiles = [];
	var pos = {
		x: laserSource.pos.x,
		y: laserSource.pos.y
	};
	var dir = {
		x: laserSource.dir.x,
		y: laserSource.dir.y
	};
	pos.x += dir.x; pos.y += dir.y;
	while (pos.x >= 0 &&
		   pos.y >= 0 &&
		   pos.x < gridSize.width &&
		   pos.y < gridSize.height) {
		// check for grid objects at
		// this pos - (1,1),
		// this pos - (1,0),
		// this pos - (0,1),
		// this pos
		var neighbour = null;
		for (var i = 0; i < grid.length; ++i) {
			if (pos.x - grid[i].pos.x <= 1 &&
			    pos.y - grid[i].pos.y <= 1 &&
			    pos.x >= grid[i].pos.x &&
			    pos.y >= grid[i].pos.y) {
				neighbour = grid[i];
				break;
			}
		}
		if (neighbour !== null) {
			// transform position
			// every time we are under
			// the influence of something,
			// we keep going until
			// we are out of its influence.
			// we will never be under anything
			// else's influence during
			// this time.

			var newDir;

			// TODO: This is probably
			// (almost definitely)
			// buggy, and untested
			// on paper.
			if (neighbour.type == 'circle') {
				// add straight tile
				tiles.push({
					pos: {x: pos.x, y: pos.y},
					tile: dir.y === 0 ? 's1' : 's2'
				});
				pos.x += dir.x; pos.y += dir.y;

				// curve tile
				if (neighbour.pos.x < pos.x) {
					// circle is on left

					if (dir.x !== 0) {
						// currently moving
						// left or right

						if (neighbour.pos.y < pos.y) {
							// circle is above

							newDir = {
								x: 0,
								y: -1
							};
						} else {
							// circle below

							newDir = {
								x: 0,
								y: 1
							};
						}
					} else {
						// currently moving
						// up or down

						// clearly we're going
						// to turn left here
						newDir = {
							x: -1,
							y: 0
						};
					}
				} else {
					// circle is on right

					if (dir.x !== 0) {
						// currently moving
						// left or right

						if (neighbour.pos.y < pos.y) {
							// circle is above

							newDir = {
								x: 0,
								y: -1
							};
						} else {
							// circle below

							newDir = {
								x: 0,
								y: 1
							};
						}
					} else {
						// currently moving
						// up or down

						// clearly we're going
						// to turn right here
						newDir = {
							x: 1,
							y: 0
						};
					}
				}

				// figure out what
				// tile we need
				if (newDir.x == 1) {
					tiles.push({
						pos: {x: pos.x, y: pos.y},
						tile: dir.y == -1 ? 'c1' : 'c4'
					});
				} else if (newDir.x == -1) {
					tiles.push({
						pos: {x: pos.x, y: pos.y},
						tile: dir.y == -1 ? 'c2' : 'c3'
					});
				} else if (newDir.y == -1) {
					tiles.push({
						pos: {x: pos.x, y: pos.y},
						tile: dir.x == 1 ? 'c3' : 'c4'
					});
				} else {
					tiles.push({
						pos: {x: pos.x, y: pos.y},
						tile: dir.x == 1 ? 'c2' : 'c1'
					});
				}

				dir = newDir;

				pos.x += dir.x; pos.y += dir.y;
				// add straight tile
				tiles.push({
					pos: {x: pos.x, y: pos.y},
					tile: dir.y === 0 ? 's1' : 's2'
				});
			} else if (neighbour.type == 'cross') {
				// add 'half-straight' tile
				// going into the cross
				if (dir.x === 0) {
					tiles.push({
						pos: {x: pos.x, y: pos.y},
						tile: dir.y == -1 ? 'x3' : 'x1'
					});
				} else {
					tiles.push({
						pos: {x: pos.x, y: pos.y},
						tile: dir.x == 1 ? 'x4' : 'x2'
					});
				}

				// transform position
				// to the new position.
				// direction is unchanged.
				if (neighbour.pos.x < pos.x) {
					if (neighbour.pos.y < pos.y) {
						// top left
						pos = {
							x: pos.x - 1,
							y: pos.y - 1
						};
					} else {
						// bottom left
						pos = {
							x: pos.x - 1,
							y: pos.y + 1
						};
					}
				} else {
					if (neighbour.pos.y < pos.y) {
						// top right
						pos = {
							x: pos.x + 1,
							y: pos.y - 1
						};
					} else {
						// bottom right
						pos = {
							x: pos.x + 1,
							y: pos.y + 1
						};
					}
				}

				// add 'half-straight' tile
				// going out of the cross
				if (dir.x === 0) {
					tiles.push({
						pos: {x: pos.x, y: pos.y},
						tile: dir.y == -1 ? 'x1' : 'x3'
					});
				} else {
					tiles.push({
						pos: {x: pos.x, y: pos.y},
						tile: dir.x == 1 ? 'x2' : 'x4'
					});
				}
			} else if (neighbour.type == 'square') {
				// figure out reflected
				// direction

				if (neighbour.pos.x < pos.x) {
					// square is on left

					if (dir.y === 0) {
						// ray going left-right

						if (neighbour.pos.y < pos.y) {
							// square is above

							newDir = {
								x: 0,
								y: 1
							};
						} else {
							// square is below

							newDir = {
								x: 0,
								y: -1
							};
						}
					} else {
						// ray going up-down

						newDir = {
							x: 1,
							y: 0
						};
					}
				} else {
					// square is on right

					if (dir.y === 0) {
						// ray going left-right

						if (neighbour.pos.y < pos.y) {
							// square is above

							newDir = {
								x: 0,
								y: 1
							};
						} else {
							// square is below

							newDir = {
								x: 0,
								y: -1
							};
						}
					} else {
						// ray going up-down

						newDir = {
							x: -1,
							y: 0
						};
					}
				}

				// figure out which
				// tile to place based
				// on dir and newDir
				if (newDir.x == 1) {
					tiles.push({
						pos: {x: pos.x, y: pos.y},
						tile: dir.y == -1 ? 'r4' : 'r3'
					});
				} else if (newDir.x == -1) {
					tiles.push({
						pos: {x: pos.x, y: pos.y},
						tile: dir.y == -1 ? 'r1' : 'r2'
					});
				} else if (newDir.y == -1) {
					tiles.push({
						pos: {x: pos.x, y: pos.y},
						tile: dir.x == 1 ? 'r2' : 'r3'
					});
				} else {
					tiles.push({
						pos: {x: pos.x, y: pos.y},
						tile: dir.x == 1 ? 'r1' : 'r4'
					});
				}

				dir = newDir;
			}
		} else {
			// add straight tile
			tiles.push({
				pos: {x: pos.x, y: pos.y},
				tile: dir.y === 0 ? 's1' : 's2'
			});
		}
		pos.x += dir.x; pos.y += dir.y;
	}

	return tiles;
}

// https://stackoverflow.com/a/17130415
function getMousePos(canvas, e) {
	var rect = canvas.getBoundingClientRect();
	var scaleX = canvas.width / rect.width,
		scaleY = canvas.height / rect.height;

	return {
		x: (e.clientX - rect.left) * scaleX,
		y: (e.clientY - rect.top) * scaleY
	};
}

function render(time) {
	if (ctx === null || images === null) return;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var cellSize = {
		width: canvas.width / gridSize.width,
		height: canvas.height / gridSize.height
	};

	drawGrid(cellSize);

	if (mousePos !== null && currentType !== null) {
		newObjectPos = mousePos;
	}

	ctx.beginPath();

	for (var i = 0; i < grid.length; ++i) {
		drawImage(cellSize, grid[i].pos, grid[i].type);
	}

	if (newObjectPos !== null && currentType !== null) {
		ctx.save();

		ctx.globalAlpha = 0.6;
		drawImage(cellSize, newObjectPos, currentType);

		ctx.restore();
	}

	for (i = 0; i < laserSources.length; ++i) {
		if (!laserSources[i].tiles) {
			laserSources[i].tiles = calcTiles(laserSources[i]);
		}
		drawTiles(cellSize, laserSources[i].tiles);
	}

	ctx.closePath();

	requestAnimationFrame(render, canvas);
}

// Helper function to load multiple images
function imageLoader(numImages, completion) {
	var count = 0;

	return function() {
		if (numImages == ++count)
			completion();
	};
}

function init() {
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');

	canvas.onmousemove = function(e) {
		var newMousePos = getMousePos(canvas, e);

		var cellSize = {
			width: canvas.width / gridSize.width,
			height: canvas.height / gridSize.height
		};

		newMousePos = {
			x: Math.round(newMousePos.x / cellSize.width) - 1.0,
			y: Math.round(newMousePos.y / cellSize.height) - 1.0
		};

		// determine if new mouse position
		// is valid

		// must be in bounds
		newMousePos.x = Math.max(0,Math.min(gridSize.width-2, newMousePos.x));
		newMousePos.y = Math.max(0,Math.min(gridSize.height-2, newMousePos.y));

		// it cannot be in any of the squares
		// adjacent to a current grid square
		for (var i = 0; i < grid.length; ++i) {
			if (Math.abs(grid[i].pos.x - newMousePos.x) <= 1 &&
			    Math.abs(grid[i].pos.y - newMousePos.y) <= 1) {
				return;
			}
		}

		mousePos = newMousePos;
	};

	canvas.onmouseleave = function(e) {
		newObjectPos = null;
		mousePos = null;
	};

	canvas.onclick = function(e) {
		if (newObjectPos !== null) {
			grid.push({
				pos: newObjectPos,
				type: currentType
			});

			// we need to recalc
			// lasers
			for (var i = 0; i < laserSources.length; ++i) {
				delete laserSources[i].tiles;
			}
		}
		newObjectPos = null;
		mousePos = null;
	};

	images = {};

	var imgNames = [
		'circle', 'cross', 'square',
		's1', 's2', 'c1', 'c2', 'c3', 'c4',
		'r1', 'r2', 'r3', 'r4',
		'x1', 'x2', 'x3', 'x4'
	];

	var l = imageLoader(imgNames.length, function() {
		requestAnimationFrame(render, canvas);
	});

	var names = {};
	var f = function() {
		images[names[this.src]] = this;
		l();
	};
	for (var i = 0; i < imgNames.length; ++i) {
		var a = new Image();
		a.onload = f;
		a.src = 'images/' + imgNames[i] + '.png';
		names[a.src] = imgNames[i];
	}
}
