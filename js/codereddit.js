$(function(){
	//Stop asynchronous tasks
	jQuery.ajaxSetup({async:false});
	
	//Get language pref if any
	var lang = $.cookie("lang");
	var style = $.cookie("style");
	
	if(lang != null)
		window.language = lang;
	else
		window.language = "php";
	
	if(style == "night")
	{
		document.body.style.background = "#000000";
		document.body.style.color = "#FFFFFF";
		window.style = "night";
	}
	else
	{
		document.body.style.background = "#FAFAFA";
		document.body.style.color = "#000000";
		window.style = "emacs";
	}
	
	//GET("sub") - the subreddit (if empty, frontpage)
	//GET("topic") - the id of the topic we're viewing
	//GET("after") - the id for the next page
	renderPage();
	
	// Bind click event handlers to our expanders and collapsers.
	$('body').delegate(".expander", "click", function(){
		if ($(this).parents('ul').first().find('.comments').is(':empty')){
			$(this).parents('ul').first().find('.comments').html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src='img/load.gif' />");
			getComments($(this).attr('id'), $(this).parents('ul').first().find('.comments'));
		}
		else {
			$(this).parents('ul').first().find('.comments').show();
		}
		$(this).addClass('collapse');
		$(this).removeClass('expander');
		
	});
	
	$('body').delegate(".collapse", "click", function(){
		$(this).parents('ul').first().find('.comments').hide();
		$(this).addClass('expander');
		$(this).removeClass('collapse');	
	});
});

//Gets value of querystring variable
function GET(variable)
{
   var query = window.location.search.substring(1);
   var vars = query.split("&");
   for (var i=0;i<vars.length;i++) {
		   var pair = vars[i].split("=");
		   if(pair[0] == variable){return pair[1];}
   }
   return '';
}

//Gimmick to turn the webpage into an editable document.
//Not very useful
function makeEditable(){
	document.designMode="on";
}

//Cycles the language among our available options. Then reload the page.
//Probably smarter ways of doing this, but why bother.
function changeLanguage(){
	if(window.language == "php")
		$.cookie("lang", "csharp");
	else if(window.language == "csharp")
		$.cookie("lang", "xml")
	else if(window.language == "xml")
		$.cookie("lang", "python")
	else
		$.cookie("lang", "php")
	window.location.reload();
}

function changeStyle(){
	if(window.style == "emacs")
		$.cookie("style", "night");
	else
		$.cookie("style", "emacs")
	window.location.reload();
}

function createTitle(entry){
	var post;
	
	// Emulate camel case, slice ridiculous title lengths, and remove characters.
	var title;
	if(entry.title != null && entry.title != '')
		title = entry.title.toLowerCase().substring(0,20).replace(/[^A-Za-z0-9\s\s+]/gi, '').split(' ');
	else
		title = entry.link_title.toLowerCase().substring(0,20).replace(/[^A-Za-z0-9\s\s+]/gi, '').split(' ');
		
	for (token in title){
		title[token] = title[token].charAt(0).toUpperCase() + title[token].slice(1);
	};
	title = title.join('');
	return title;
}

function renderPage(){
	var topic = GET('topic');
	var sub = GET('sub');
	var user = GET('user');
	var after = GET('after');
	var language = window.language;
	var style = window.style;
	
	var url;
	var template_url;
	var page_type;
	
	//Determine what url we want, contact reddit accordingly.
	if (sub != '')
	{
		//Subreddit Page
		page_type = "r";
		url = "http://www.reddit.com/r/" + sub + "/.json?after=" + after + "&jsonp=?";
		template_url = 'templates/' + window.language + '.topics'
	}
	else if (topic != '')
	{
		//Comments Page
		page_type = "comments";
		url = "http://www.reddit.com/comments/" + topic + "/.json?jsonp=?";
		template_url = 'templates/' + window.language + '.single_topic'
	}
	else if (user != '')
	{
		//User Page
		page_type = "user";
		url = "http://www.reddit.com/user/" + user + "/.json?after=" + after + "&jsonp=?";
		template_url = 'templates/' + window.language + '.user'
	}
	else
	{
		//Front Page
		page_type = "";
		url = "http://www.reddit.com/.json?after=" + after + "&jsonp=?";
		template_url = 'templates/' + window.language + '.topics'
	}
	

	$.get('templates/' + window.language + '.header', function(template){
			var code_templ = template;
			
			if(page_type == 'comments')
				code_templ = code_templ.replace(/\${location}/g, "/comments/" + topic);
			else if(page_type == 'r')
				code_templ = code_templ.replace(/\${location}/g, "/r/" + sub);
			else if(page_type == 'user')
				code_templ = code_templ.replace(/\${location}/g, "/user/" + user);
			else
				code_templ = code_templ.replace(/\${location}/g, "frontpage");
				
			$('body').append(code_templ);
			
	},"text");

	
	$.getJSON(url,function(things) {
			$.get(template_url, function(template){
				var loop_x_times = 1;
				var true_entry;
				
				if(page_type == "r" || page_type == "")
					loop_x_times = things.data.children.length
				
				for(var i=0; i<loop_x_times; i++){
				//$.each(things.data.children, function(entry){
					var code_templ = template;
					
					if(page_type == "r" || page_type == "")
						true_entry = things.data.children[i].data
					else
						true_entry = things[0].data.children[i].data
						
					if (true_entry.selftext)
						code_templ = code_templ.replace(/\${selftext}/g, formatCommentText(true_entry.selftext, "    "));
					else 
						code_templ = code_templ.replace(/\${selftext}/g, "");

					code_templ = code_templ.replace(/\${title}/g,createTitle(true_entry));
					code_templ = code_templ.replace(/\${fancybox}/g, "");
					code_templ = code_templ.replace(/\${subreddit}/g, true_entry.subreddit);
					code_templ = code_templ.replace(/\${url}/g, true_entry.url);
					code_templ = code_templ.replace(/\${author}/g, true_entry.author);
					code_templ = code_templ.replace(/\${score}/g, true_entry.score);
					code_templ = code_templ.replace(/\${domain}/g, true_entry.domain);
					code_templ = code_templ.replace(/\${fulltitle}/g, true_entry.title);
					code_templ = code_templ.replace(/\${num_comments}/g, true_entry.num_comments);
					code_templ = code_templ.replace(/\${entry_id}/g, true_entry.name);
					code_templ = code_templ.replace(/\${short_id}/g, true_entry.name.replace('t3_', ''));
					
					
					
					if(page_type == "comments"){
						getComments(true_entry.name, '', things);
						//Comments are passed back in window.output.
						code_templ = code_templ.replace("${comments}", window.output);//.replace(/</g,'&lt;').replace(/>/g,'&gt;'));
					}
					
					$('body').append(code_templ);
					
				}
				
				//Puts up an affiliate link if our adsense was blocked
				placeAdBlockAd();
				
				//Add a link to the next page if we're in a subreddit or frontpage
				if(page_type == "r" || page_type == ""){
					$.get('templates/' + window.language + '.footer', function(template){
						var code_templ = template;
						after = "?sub=" + GET("sub") + "&after=" + things.data.after;
						code_templ = code_templ.replace(/\${next_url}/g, after);
							
						$('body').append(code_templ);
					},"text");					
				}
				
				$("pre." + window.language).snippet(window.language, {style:window.style, showNum: false, transparent: true, menu: false});
			},"text");
			
	});
	
	
}

//Loads an amazon affiliate link if our adsense was blocked
function placeAdBlockAd(){
	if (typeof(window.__google_ad_urls) == "undefined")
	{
		template = $.get('templates/' + window.language + '.topics', function(data) {},"text");
		template = template.responseText;
		
		var code_templ = template;
		code_templ = code_templ.replace(/\${selftext}/g, "");
		code_templ = code_templ.replace(/\${title}/g,"BuyUnnecessaryStuff");
		code_templ = code_templ.replace(/\${fancybox}/g, "");
		code_templ = code_templ.replace(/\${subreddit}/g, "");
		code_templ = code_templ.replace(/\${url}/g, "http://www.amazon.com?tag=codereddit-20");
		code_templ = code_templ.replace(/\${author}/g, "admin");
		code_templ = code_templ.replace(/\${score}/g, "10000");
		code_templ = code_templ.replace(/\${domain}/g, "www.codereddit.com");
		code_templ = code_templ.replace(/\${fulltitle}/g, "This affiliate link helps pay our bills.");
		code_templ = code_templ.replace(/\${num_comments}/g, "-1");
		code_templ = code_templ.replace(/\${entry_id}/g, "");
		code_templ = code_templ.replace(/\${short_id}/g, "");
					
		$('body').append(code_templ);
	}
}

function getComments(raw_id, comment_location, cached_comments){	
	//Make a global variable for convenience
	window.output = "";
			
	// Retrieve and display comments
	var id = raw_id.replace('t3_', '');
	var text = '';
	var comment_url = 'http://www.reddit.com/comments/' + id + '/.json?jsonp=?';
	
	var template;
	
	if (template == 'undefined' || template == null)
	{
		template = $.get('templates/' + window.language + '.comment', function(data) {},"text");
		template = template.responseText.replace(/</g,'&lt;').replace(/>/g,'&gt;');
	}
	
	if(cached_comments != 'undefined' && cached_comments != null && cached_comments != '')
	{
		comments = cached_comments[1].data.children.slice(0,50);

		for(var i=0; i<comments.length; i++){
			var tmp_template = template.replace(/\${commenter}/g, comments[i].data.author);
			tmp_template = tmp_template.replace(/\${score}/g, comments[i].data.ups - comments[i].data.downs);
			tmp_template = tmp_template.replace(/\${text}/g, formatCommentText(comments[i].data.body, "        "));
			tmp_template = tmp_template.replace(/\${indent}/g, "        ");
			window.output += tmp_template;
			//Store all the comments in window.output variable, we'll pull it out later
			
			getReplies(comments[i], 1, template);
		}
		//Will pull it out of window.output later
	}
	else
	{
		var comments = $.getJSON(comment_url, function(comments){
			comments = comments[1].data.children.slice(0,50);

			for(var i=0; i<comments.length; i++){
				var tmp_template = template.replace(/\${commenter}/g, comments[i].data.author);
				tmp_template = tmp_template.replace(/\${score}/g, comments[i].data.ups - comments[i].data.downs);
				tmp_template = tmp_template.replace(/\${text}/g, formatCommentText(comments[i].data.body, "        "));
				tmp_template = tmp_template.replace(/\${indent}/g, "        ");
				window.output += tmp_template;
				//Store all the comments in window.output variable, we'll pull it out later
				
				getReplies(comments[i], 1, template);
			}
			
			if(comment_location != ''){
				comment_location.text(window.output);
				comment_location.snippet(window.language, {style:window.style, showNum: false, transparent: true, menu: false});
			}
		});
	}
	return;
}

function getReplies(parent, depth, template) {
	//Short circuit at depth 10
	if (depth > 10 || parent == null || parent.data == null || parent.data.replies == null || parent.data.replies.data == null)
		return;
	
	if (template == 'undefined' || template == null)
	{
		template = $.get('templates/' + window.language + '.comment', function(data) {},"text");
		template = template.responseText.replace(/</g,'&lt;').replace(/>/g,'&gt;');
	}
	
	for (var i = 0; i < parent.data.replies.data.children.length; i++)
	{
		var indent = Array(depth+3).join("    ");
		var reply = parent.data.replies.data.children[i];

		if (reply.data.body != null)
		{
			var date = reply.data.created_utc;

			var score = 0;
			if (reply.data.ups != null && reply.data.ups != "")
				score += parseInt(reply.data.ups);
			if (reply.data.downs != null && reply.data.downs != "")
				score -= parseInt(reply.data.downs);

			var tmp_template = template.replace(/\${commenter}/g, reply.data.author);
			tmp_template = tmp_template.replace(/\${score}/g, reply.data.ups - reply.data.downs);
			tmp_template = tmp_template.replace(/\${text}/g, formatCommentText(reply.data.body, indent));
			tmp_template = tmp_template.replace(/\${indent}/g, indent);
			
			window.output += tmp_template;
			
			//Recurse down the reply tree!
			getReplies(reply, depth + 1, template);
		}
	}
}

function formatCommentText(text, space){
	var new_text = "";
	if(text != null)
	{    
		var comment_start = '/*';
		var comment_end = '*/';
		if(window.language == "php" || window.language == "csharp")
		{
			comment_start = '/*';
			comment_end = '*/';
		}
		else if(window.language == "xml")
		{
			comment_start = ''; //We wrap it in <comment> tags instead
			comment_end = '';
		}
		else if(window.language == "python")
		{
			comment_start = ''; //We wrap it in ''' quotes instead
			comment_end = '';
		}
			
		var converter = new Markdown.Converter();
		text = text.replace(/(\r\n|\n|\r)/gm," ");
		text = converter.makeHtml(text);
		
		i=0;
		var next_space;
		new_text = comment_start + '\n' + space;
		if(window.language == "python")
			new_text += "#";
			
		while(i+80 < text.length)
		{
			var next_space = text.indexOf(' ',i+80);
			
			//If there are no spaces until the end, exit out of the loop and finish up
			if(next_space == -1)
				break;
				
			new_text = new_text + text.substring(i, next_space) + '\n' + space;
			if(window.language == "python")
				new_text += "#";
			i = next_space+1;
		}
		new_text = new_text + text.substring(i, text.length) + '\n' + space + comment_end;
	}
	return new_text;
}
