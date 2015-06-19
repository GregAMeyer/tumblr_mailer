var fs = require('fs');
var ejs = require('ejs');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('XXX');
// Authenticate via OAuth
var tumblr = require('tumblr.js');
var client = tumblr.createClient({
  consumer_key: 'XXX',
  consumer_secret: 'XXX',
  token: 'XXX',
  token_secret: 'XXX'
});
// Make the request
client.userInfo(function (err, data) {
	//...what goes here?
});
var csvFile = fs.readFileSync("friend_list.csv","utf8");
//reads the CSV file of contacts and keys

function csvParse(csvFile){
    var arrayOfObjects = [];
    var arr = csvFile.split("\n");
    var newObj;
    var keys = arr.shift().split(",");
    arr.forEach(function(contact){
        contact = contact.split(",");
        newObj = {};
        for(var i =0; i<contact.length; i++){
            newObj[keys[i]] = contact[i];
        }
        arrayOfObjects.push(newObj);
    });
    return arrayOfObjects;
}

var template = fs.readFileSync('email_template.ejs', 'utf8');
//reads the ejs template, allowing you to put it in the ejs.render method
//the render method takes template and an object
//it replaces keywords in template with matching object keys' values
//think YESWARE mail merge
function emailEJS(friendList){
	var customizedEmails = [];
	for (var i = 0; i < friendList.length; i++) {
		customizedEmails.push( ejs.render(template,friendList[i]) );
	};
	return customizedEmails;
};
function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
};

client.posts('gregameyer.tumblr.com', function(err, blog){
	var latestPosts = [];
	var posts = blog.posts; //array of posts, each of which is an object
	for (var i = 0; i < posts.length; i++) {
		var thisPost = posts[i];
	 	var currentTime = Math.floor(Date.now() / 1000);
	 	var oneWeek = 518400;
		if((currentTime - thisPost['timestamp']) < oneWeek){
	 		var blogObj = {};
			blogObj.href=thisPost.short_url;
			blogObj.title=thisPost.title;
			latestPosts.push(blogObj);
			// latestPosts is array of the 
			// latest posts objects that include url and title
	 	}
	};
	var friendList = csvParse(csvFile);
	//returns array of objects below:
	// [ 
	//   { firstName: 'Scott',
	//     lastName: 'D\'Alessandro',
	//     numMonthsSinceContact: '0',
	//     emailAddress: 'scott@fullstackacademy.com' 
	//   },
	//   { firstName: 'Greg',
	//     lastName: 'Meyer',
	//     numMonthsSinceContact: '2',
	//     emailAddress: 'gregmeyer888@gmail.com' 
	//   }
	// ]
	for (var y = 0; y < friendList.length; y++) {
		friendList[y].latestPosts = latestPosts
	};
	//friendList now has firstName, lastName, numMonths...
	// AND latestsPosts: [ {href: 'something', title: 'something'}, 
	//                     {href: 'something', title: 'something'} ]
	var emailArray = emailEJS(friendList);
	//an array of customized emails
	for (var x = 0; x < emailArray.length; x++) {
		sendEmail(friendList[x]['firstName'], friendList[x]['emailAddress'], 'Greg', 'gregmeyer888@gmail.com', 'test', emailArray[x])
	};
});





//console.log(emailArray); //outputs an array of strings:
// [ '<html>\n<head><meta charset=\'utf-8\'></head>\n<body>\n  
// <p>Hey Scott,</p>\n  <br>\n  <p>\n    
// How are you doing? I\'m doing well. It\'s been almost 0 months\n   
//  since we last talked. ... ]
