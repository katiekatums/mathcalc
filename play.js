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

    gen_inputs();
    new_problem();
    $('#progress span').attr('style','width: 0%');

    console.log('hello');
});

var in_pile = [];
var out_pile = [];
var current = undefined;
var correct = 0;
var final_time = undefined;
var init_time = new Date();
init_time = init_time.getTime();

function Problem(a,b) {
    this.a = a;
    this.b = b;
    this.guess = '';
    this.op = '+';
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


Problem.prototype.problem_statement = function() {
    return this.a + ' ' + this.op + ' ' + this.b;
}

Problem.prototype.answer = function() {
    if(this.op == '+') {
	return this.a + this.b;
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

function gen_inputs() {
    var max = 10;
    var howmany = 30;

    var ordered = [];
    var shuffleme = [];
    var l = 0;
    for(var i = 0 ; i <= max ; i++) {
	for(var j = 0 ; j <= max ; j++) {
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
	var newGuy = new Problem(ordered[shuffleme[i]][0],
				 ordered[shuffleme[i]][1]);
	in_pile.push(newGuy);
    }
};

function num_click() {
    var button = $(this).attr('id').slice(1);
    if(button == "ENTER") {
	current.stop_timer();
	if(current.correct()) {
	    correct = correct + 1;
	    $('#sofar').html('★ '+correct);
	}
	new_problem();
	var progress = out_pile.length / (out_pile.length + in_pile.length + 1);
	$('#progress span').attr('style','width: ' + Math.floor(100*progress) + '%');
    } else if(button == "BACK") {
	if(current.guess.length > 0) {
	    current.guess = current.guess.slice(0,current.guess.length-1);
	}
    } else {
	if(current.guess.length < 3) {
	    current.guess = current.guess + button;
	}
    }
    $('#rhs').html(current.guess);
    return false;
};

function new_problem() {
    if(current != undefined) {
	out_pile.push(current);
    }
    if(in_pile.length <= 0) {
	var d = new Date();
	final_time = d.getTime();
	summarize();
	return;
    }
    current = in_pile.pop();
    current.start_timer();
    $('#lhs').html(current.problem_statement() + ' =');
};

function make_time(ms) {
    var out_sec = Math.floor(ms/1000);
    var out_min = Math.floor(out_sec/60);
    out_sec -= out_min*60;
    return out_min + 'm ' + out_sec + 's';
};

function summarize() {
    out_pile.sort(function (a,b) {return b.time - a.time});
    $("#area").load('summary.html', function() {
	if(correct == 0) {
	    $('#center h').html('Sorry!');
	}
	$("#correct").html('Correct Answers: ' + correct + '/' + out_pile.length);
	$("#totaltime").html('Total Time: ' + make_time(final_time-init_time));
	var mid = Math.round(out_pile.length/2)-1;
	$("#mediantime").html('Median Time: ' + out_pile[mid].time + 's');
	for(var i = 0 ; i < out_pile.length ; i++) {
	    console.log(out_pile[i].time);
	    var classname = undefined;
	    if(out_pile[i].correct()) { 
		classname = "correct";
	    } else {
		classname = "incorrect";
	    }
	    $("#responses table")
		.append($('<tr/>', {class:classname})
			.append($('<td/>', {text:i+1}))
			.append($('<td/>',
				  {text:out_pile[i].problem_statement() + ' = ' +
				   out_pile[i].answer()}))
			.append($('<td/>',{text:out_pile[i].guess}))
			.append($('<td/>',
				  {text:out_pile[i].time + 's'}))
			);
	}
    });
}

function submit_data() {
    var out = {};
    out['spamkey'] = $('#spamkey')[0].value;
    var column = 1;
    for(var i in out_pile) {
	out['c'+column++] = out_pile[i].a;
	out['c'+column++] = out_pile[i].b;
	out['c'+column++] = out_pile[i].guess;
	out['c'+column++] = out_pile[i].time;
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
