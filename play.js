MACRO_ID = 'AKfycbxrAJNxj5ZvRuk0JltXGZlrroSM1EZJIanI5ZUrFZfjdzGmJP7Z';

$(document).ready(function () {
    for(var i = 1 ; i <= 9 ; i++) {
	$("#numpad").append($('<div/>', {
	    "class":"num", "id":"n"+i,text:i
	}));
    }
    others = ["BACK", "0", "ENTER"];
    for(var i in others) {
	$("#numpad").append($('<div/>', {
	    "class":"num", "id":"n"+others[i],text:others[i]
	}));
    }
    var click_event = ((document.ontouchstart) !== null) ? 'click' : 'touchstart';
    $('.num').bind(click_event,num_click);

    game = new Game();
    game.new_problem();
    $('#progress span').attr('style','width: 0%');

    console.log('hello');
});

var game = undefined;


function Game() {
    this.in_pile = [];
    this.out_pile = [];
    this.current = undefined;
    this.correct = 0;
    this.final_time = undefined;
    this.init_time = new Date();
    this.init_time = this.init_time.getTime();
    this.read_config();
    this.gen_inputs(30);
};

Game.prototype.read_config = function() {
    var qs = parse_query_string();
    if(qs.max != undefined) {
	var newmax = parseInt(qs.max);
	if(newmax > 0 && newmax < 30) {
	    // worst case here is 30*30 = 900 (only 3 digits in readout)
	    this.max = newmax;
	} else {
	    this.max = 10;
	}
    }
    
    if(qs.op != undefined) {
	if(qs.op == 'plus') {
	    this.op = '+';
	} else if(qs.op == 'mult') {
	    this.op = '*';
	} else if(qs.op == 'div') {
	    this.op = '/';
	} else if(qs.op == 'minus') {
	    this.op = '-';
	} else {
	    this.op = '+';
	}
    } else {
	this.op = '+';
    }
    if(qs.note != undefined) {
	this.note = qs.note[0].slice(0,20);
    } else {
	this.note = '';
    }
}

Game.prototype.gen_inputs = function(howmany) {
    var ordered = [];
    var shuffleme = [];
    var l = 0;
    for(var i = 0 ; i <= this.max ; i++) {
	for(var j = 0 ; j <= this.max ; j++) {
	    if(this.op == '/' && i == 0) {
		// no divide by zero questions
		continue;
	    }
	    ordered.push([i,j]);
	    shuffleme.push(l);
	    l += 1;
	}
    }
    // fisher-yates from wikipedia
    for(var i = shuffleme.length-1 ; i >= 1 ; i--) {
	var j = Math.floor(Math.random()*(i+1));
	if(j >= shuffleme.length) {
	    // surely some browser messed up Math.random()
	    continue;
	}
	var tmp = shuffleme[j];
	shuffleme[j] = shuffleme[i];
	shuffleme[i] = tmp;
    }
    for(var i = 0 ; i < howmany ; i++) {
	if(this.op == '+' || this.op == '*') {
	    var newGuy = new Problem(ordered[shuffleme[i]][0],
				     ordered[shuffleme[i]][1],
				     this.op);
	} else if(this.op == '-') {
	    var newGuy = new Problem(ordered[shuffleme[i]][0]
				     + ordered[shuffleme[i]][1],
				     ordered[shuffleme[i]][0],
				     this.op);
	} else if(this.op == '/') {
	    var newGuy = new Problem(ordered[shuffleme[i]][0]
				     * ordered[shuffleme[i]][1],
				     ordered[shuffleme[i]][0],
				     this.op);
	}
	this.in_pile.push(newGuy);
    }
};

Game.prototype.new_problem = function() {
    if(this.current != undefined) {
	this.out_pile.push(this.current);
    }
    if(this.in_pile.length <= 0) {
	var d = new Date();
	this.final_time = d.getTime();
	this.summarize();
	return;
    }
    this.current = this.in_pile.pop();
    this.current.start_timer();
    $('#lhs').html(this.current.problem_statement() + ' =');
};

Game.prototype.summarize = function() {
    this.out_pile.sort(function (a,b) {return b.time - a.time});
    $("#area").load('summary.html?0.1.1', function() {
	if(game.correct == 0) {
	    $('#center h').html('Sorry!');
	}
	$("#correct").html('Correct Answers: ' + game.correct + '/' +
			   game.out_pile.length);
	$("#totaltime").html('Total Time: ' + make_time(game.final_time-game.init_time));
	var mid = Math.round(game.out_pile.length/2)-1;
	$("#mediantime").html('Median Time: ' + game.out_pile[mid].time + 's');
	for(var i = 0 ; i < game.out_pile.length ; i++) {
	    console.log(game.out_pile[i].time);
	    var classname = undefined;
	    if(game.out_pile[i].correct()) { 
		classname = "correct";
	    } else {
		classname = "incorrect";
	    }
	    $("#responses table")
		.append($('<tr/>', {class:classname})
			.append($('<td/>', {text:i+1}))
			.append($('<td/>',
				  {text:game.out_pile[i].problem_statement() + ' = ' +
				   game.out_pile[i].answer()}))
			.append($('<td/>',{text:game.out_pile[i].guess}))
			.append($('<td/>',
				  {text:game.out_pile[i].time + 's'}))
			);
	}
    });
};

function Problem(a,b,op) {
    this.a = a;
    this.b = b;
    this.guess = '';
    this.op = op;
    console.log(a);
};

Problem.prototype.start_timer = function() {
    this.time = new Date();
    this.time = this.time.getTime();
};

Problem.prototype.stop_timer = function() {
    var now = new Date();
    this.time = (now - this.time)/1000;
};

Problem.prototype.utf8_for_op = function() {
    if(this.op == '*') {
	return '×';
    } else if(this.op == '-' || this.op == '+' || this.op == '/') {
	return this.op;
    } else {
	return '?';
    }
}

Problem.prototype.problem_statement = function() {
    return this.a + ' ' + this.utf8_for_op() + ' ' + this.b;
}

Problem.prototype.answer = function() {
    if(this.op == '+') {
	return this.a + this.b;
    } else if(this.op == '*') {
	return this.a * this.b;
    } else if(this.op == '-') {
	return this.a - this.b;
    } else if(this.op == '/') {
	return this.a / this.b;
    }
};

Problem.prototype.correct = function() {
    if(parseInt(this.guess) == this.answer()) {
	console.log('correct');
	return true;
    } else {
	return false;
    }
};


function num_click() {
    var button = $(this).attr('id').slice(1);
    if(button == "ENTER") {
	game.current.stop_timer();
	if(game.current.correct()) {
	    game.correct = game.correct + 1;
	    $('#sofar').html('★ '+game.correct);
	}
	game.new_problem();
	var progress = game.out_pile.length / (game.out_pile.length +
					       game.in_pile.length + 1);
	$('#progress span').attr('style','width: ' + Math.floor(100*progress) + '%');
    } else if(button == "BACK") {
	if(game.current.guess.length > 0) {
	    game.current.guess = game.current.guess.slice(0,game.current.guess.length-1);
	}
    } else {
	if(game.current.guess.length < 3) {
	    game.current.guess = game.current.guess + button;
	}
    }
    $('#rhs').html(game.current.guess);
    return false;
};

function make_time(ms) {
    var out_sec = Math.floor(ms/1000);
    var out_min = Math.floor(out_sec/60);
    out_sec -= out_min*60;
    return out_min + 'm ' + out_sec + 's';
};

function submit_data() {
    var out = {};
    out['spamkey'] = $('#spamkey')[0].value;
    var column = 1;
    out['c'+column++] = game.note;
    var op = 'plus';
    if(game.op == '*') {
	op = 'mult';
    } else if(game.op == '/') {
	op = 'div';
    } else if(game.op == '-') {
	op = 'minus';
    }
    out['c'+column++] = op;
    for(var i in game.out_pile) {
	out['c'+column++] = game.out_pile[i].a;
	out['c'+column++] = game.out_pile[i].b;
	out['c'+column++] = game.out_pile[i].guess;
	out['c'+column++] = game.out_pile[i].time;
    }
    $('#status').html('Submitting..');
    var scr = document.createElement('script');
    scr.type = 'text/javascript';
    scr.src = 'https://script.google.com/macros/s/' + MACRO_ID + '/exec?' +
	$.param(out);
    document.head.appendChild(scr);
    return false;
}

function error_callback(e) {
    $('#status').html(e['error']);
}

function good_callback(e) {
    $('#status').html('Submitted: row ' + e['row']);
    $('#submitter').prop('disabled', true);
}
function section(num,field) {
    return '&c' + num + '=' + field;
}

function parse_query_string() {
    var query = (window.location.search || '?').substr(1),
    map   = {};
    query.replace(/([^&=]+)=?([^&]*)(?:&+|$)/g, function(match, key, value) {
        (map[key] = map[key] || []).push(value);
    });
    return map;
};
