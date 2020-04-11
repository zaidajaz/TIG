
$(document).ready(function(){
	$.getJSON( "js/out.json", function( data ) {
	   console.log(data);
	   var template = $('.template').html();
	   $('.output').html(Mustache.render(template,data));
	});
});


