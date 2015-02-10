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

	var newCommentID;

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
					comment.id = response.newCommentID;
					newCommentID = response.newCommentID;

					// We'll need this if we want to delete the comment.
					var newComment = sideComments.insertComment( comment );

				}else{

					// console.log( 'success, response.type not equal to success' );
					// console.log( response );

				}

			},
			error: function( jqXHR, textStatus, errorThrown ){
				
				// console.log( [jqXHR, textStatus, errorThrown] );

			}
		} );

	});

	// Listen to "commentDeleted" and send a request to your backend to delete the comment.
	// More about this event in the "docs" section.
	sideComments.on( 'commentDeleted', function( comment ){
	

		$.ajax( {
			url: ajaxURL,
			dataType: 'json',
			type: 'POST',
			data: {
				action: 		'delete_side_comment',
				nonce: 			nonce,
				postID: 		postID,
				commentID: 		comment.id
			},
			success: function( response ){
				
				if( response.type == 'success' ){

					comment.sectionId = comment.sectionId;

					// OK, we can remove it from the stream
					sideComments.removeComment( comment.sectionId, newCommentID );

				}else{

					console.log( 'success, response.type not equal to success' );
					console.log( response );

				}

			},
			error: function( jqXHR, textStatus, errorThrown ){
				console.log( 'in error' );
				console.log( jqXHR );
				console.log( textStatus );
				console.log( errorThrown );
			}
		} );

		// $.ajax({
		// 	url: '/comments/' + commentId,
		// 	type: 'DELETE',
		// 	success: function( success ) {
		// 		// Do something.
		// 	}
		// });

	});
// Adds .active to the parent p.commentable-section of .marker when clicked
	$( ".marker", ".side-comment" ).on('click', function() {

	 	if(!$(this).parent().hasClass('active') ) {
 	 		$(this).parent().parent('p.commentable-section').addClass('active');
 	 	} else { 
 	 		$(this).parent().parent('p.commentable-section').removeClass('active');
 	 	}
 	});

	//Removes .active from p.commentable-section when the cursor is click anywhere else but .commment-wrapper. Used to mimic same nature of side comments
	$('#content, html').on('click', function(e) {
		var clicked = $(e.target); // get the element clicked
		if (clicked.is('.comments-wrapper, .marker') || clicked.parents().is('.comments-wrapper, .marker')) {
			return; // click happened within the dialog, do nothing here
	   } else { // click was outside the dialog, so close it
	     $( ".commentable-section" ).removeClass( "active" );
	   }
	});

	// Stops page from scrolling when mouse is hovering .comments-wrapper .comments    
		if ($(window).width() > 767) {	
			$( '.comments-wrapper .comments' ).bind( 'mousewheel DOMMouseScroll', function ( e ) {
			    var e0 = e.originalEvent,
			        delta = e0.wheelDelta || -e0.detail;
			    
			    this.scrollTop += ( delta < 0 ? 1 : -1 ) * 10;
			    e.preventDefault();
			});
		}	

});