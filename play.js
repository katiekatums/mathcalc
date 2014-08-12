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
    $('.num').click(num_click);

    gen_inputs();
    new_problem();
    console.log('hello');
});

var guess = '';
var problems = [];
thisproblem = [];
var stats = [0,0];

function gen_inputs() {
    var max = 12;
    var howmany = 5;

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
	problems.push(ordered[shuffleme[i]]);
    }
};

function num_click() {
    var button = $(this).attr('id').slice(1);
    if(button == "ENTER") {
	check_problem();
	new_problem();
    } else if(button == "BACK") {
	if(guess.length > 0) {
	    guess = guess.slice(0,guess.length-1);
	}
    } else {
	if(guess.length < 3) {
	    guess = guess + button;
	}
    }
    $('#rhs').html(guess);
};

function new_problem() {
    if(problems.length <= 0) {
	summarize();
	return;
    }
    thisproblem = problems.pop();
    guess = '';
    $('#lhs').html(thisproblem[0] + ' + ' + thisproblem[1] + ' =');
};

function check_problem() {
    if(parseInt(guess) == (thisproblem[0] + thisproblem[1])) {
	stats[0] += 1;
    }
    stats[1] += 1;
}

function summarize() {
    $("#area").html($('<div/>', {
	"id":"summary",text:'DONE: ' + stats[0] + '/' + stats[1]
    }));
}
