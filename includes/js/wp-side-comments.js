jQuery(document).ready(function($) {

	// Initialize ourselves
	var SideComments 		= require( 'side-comments' );

	// We get this data from PHP
	var postComments 		= commentsData.comments;
	var userData 			= commentsData.user;

	var nonce 				= commentsData.nonce;
	var postID 				= commentsData.postID;
	var ajaxURL 			= commentsData.ajaxURL;
	var containerSelector 	= commentsData.containerSelector;

	// Format our data as side-comments.js requires
	currentUser = {
		
		id: userData.id,
		avatarUrl: userData.avatar,
		name: userData.name

	};

	var formattedCommentData = [];
	var key;

	for( key in postComments ){

		if( arrayHasOwnIndex( postComments, key ) ){
			
			var additionalObject = {
				'sectionId': key,
				'comments': postComments[key]
			};

			formattedCommentData.push( additionalObject );

		}

	}

	// Then, create a new SideComments instance, passing in the wrapper element and the optional the current user and any existing comments.
	sideComments = new SideComments( containerSelector, currentUser, formattedCommentData );

	// http://stackoverflow.com/questions/9329446/how-to-do-for-each-over-an-array-in-javascript
	function arrayHasOwnIndex(array, prop) {
		return array.hasOwnProperty(prop) && /^0$|^[1-9]\d*$/.test(prop) && prop <= 4294967294; // 2^32 - 2
	}

	// We need to listen for the post and delete events and post an AJAX response back to PHP
	sideComments.on( 'commentPosted', function( comment ){
		
		$.ajax( {
			url: ajaxURL,
			dataType: 'json',
			type: 'POST',
			data: {
				action: 		'add_side_comment',
				nonce: 			nonce,
				postID: 		postID,
				sectionID: 		comment.sectionId,
				comment: 		comment.comment,
				authorName: 	comment.authorName,
				authorId: 		comment.authorId
			},
			success: function( response ){

				if( response.type == 'success' ){

					// OK, we can insert it into the stream
					sideComments.insertComment( comment );

				}else{

					console.log( response );

				}

			}
		} );

	});

	// Listen to "commentDeleted" and send a request to your backend to delete the comment.
	// More about this event in the "docs" section.
	sideComments.on('commentDeleted', function( commentId ) {

		// $.ajax({
		// 	url: '/comments/' + commentId,
		// 	type: 'DELETE',
		// 	success: function( success ) {
		// 		// Do something.
		// 	}
		// });

	});

});