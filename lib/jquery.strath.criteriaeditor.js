/* Based on Tagify by Alicia Liu */
// Requires JSON.stringify

(function ($) {

$.widget("strath.criteriaeditor", {
options: {
delimiters: [13, 59], // what user can type to complete a tag in char codes: [enter], [comma]
outputDelimiter: ',', // delimiter for tags in original input field
cssClass: 'widget-container', // CSS class to style the widget div and tags, see stylesheet
addTagPrompt: 'add recipients', // placeholder text
ajaxScript: null,
width: 500
},
//TODO: check ajaxScript is set
_create: function() {
	var self = this,
	el = self.element,
	opts = self.options;
	this.tags = [];
	
	// hide text field and replace with a div that contains its own input field for entering tags
	this.tagInput = $("<input type='text'>")
	.width( 'auto' ).height('auto')
	.attr( 'placeholder', opts.addTagPrompt )
	.keypress( function(e) {
	var $this = $(this),
	pressed = e.which;
	
	for ( i in opts.delimiters ) {
	
	if (pressed == opts.delimiters[i]) {
	self.add( $this.val() );
	e.preventDefault();
	return false;
	}
	}
	})
	// for some reason, in Safari, backspace is only recognized on keyup
	.keyup( function(e) {
	var $this = $(this),
	pressed = e.which;
	
	// if backspace is hit with no input, remove the last tag
	if (pressed == 8) { // backspace
	if ( $this.val() == "" ) {
	self.remove();
	return false;
	}
	return;
	}
	});
	
	this.tagDiv = $("<div>")
	.addClass( opts.cssClass )
	.width(opts.width)
	.height('auto')
	.click( function() {
	$(this).children('input').focus();
	})
	.append( this.tagInput )
	.insertAfter( el.hide() );
	
	// if the field isn't empty, parse the field for tags, and prepopulate existing tags
	var initVal = $.trim( el.val() );
	
	if ( initVal ) {
	var initTags = initVal.split( opts.outputDelimiter );
	$.each( initTags, function(i, tag) {
	self.add( tag );
	});
	}
},

_setOption: function( key, value ) {
	options.key = value;
},

_createRemoveButton: function(index) {
	return $("<a href='#'>x</a>")
	.click( function(ind) {
		return function() {
			self.remove( ind );
			return false;
		};
	}(index));
},

// add criteria, public function
add: function(text) {
     var self = this;
     text = text || self.tagInput.val();
     if (text) {

	 var tagIndex = self.tags.length;
	 
		parts = text.split(/\s*\;\s*/);
		for(var i = 0; i < parts.length; i++) {
			if(parts[i] == '') continue; //TODO: Trim this (IE doesn't like .trim());
			criterionText = parts[i];
			var ind = tagIndex + i;
			/* we want to replace this with something like:
			 * var newCriterion = $('<span>').criterion();
			 */
			var newCriterion = $('<span>').criterion({editor: self, id: ind, text: criterionText });
			
			self.tagInput.before( newCriterion );
			self.tags.push( newCriterion ); // add to underlying text box
		}
	
	
		self.tagInput.val('');
}
},

// remove a tag by index, public function
// if index is blank, remove the last tag
remove: function( criterion ) {
	var self = this;
	var tagIndex = null;
	if(criterion != null) {
		tagIndex = criterion.options.id;
	}
	
	if ( tagIndex == null || tagIndex === (self.tags.length - 1) ) {
	this.tagDiv.children("span").last().remove();
	self.tags.pop();
	}
	if ( typeof(tagIndex) == 'number' ) {
	// otherwise just hide this tag, and we don't mess up the index
	this.tagDiv.children( "span:eq(" + tagIndex + ")" ).hide();
	// we rely on the serialize function to remove null values
	delete( self.tags[tagIndex] );
	}
},

// serialize the tags with the given delimiter, and write it back into the tagified field
serialize: function() {
var self = this;
var delim = self.options.outputDelimiter;
var tagsStr = self.tags.join( delim );

// our tags might have deleted entries, remove them here
var dupes = new RegExp(delim + delim + '+', 'g'); // regex: /,,+/g
var ends = new RegExp('^' + delim + '|' + delim + '$', 'g'); // regex: /^,|,$/g
var outputStr = tagsStr.replace( dupes, delim ).replace(ends, '');

self.element.val(outputStr);
return outputStr;
},

//TODO: Get the proper Moodle URLs for images in here
icons: {
	'ds_username': 'http://localhost/moodle/theme/blocks/pix/i/user.gif',
	'registration_number': 'http://localhost/moodle/theme/blocks/pix/i/user.gif',
	'group': 'http://localhost/moodle/theme/blocks/pix/i/group.gif',
	'grouping': 'http://localhost/moodle/theme/blocks/pix/i/group.gif',
	'course': 'http://localhost/moodle/theme/blocks/pix/i/course.gif',
	'edit': 'http://localhost/moodle/theme/blocks/pix/i/edit.gif',
	'delete': 'http://localhost/moodle/theme/blocks/pix/t/delete.gif'},
icon: function(type) {
	if(this.icons[type]) {
		return $('<img>').attr('src', this.icons[type]).attr('title', type).attr('alt', type);
	} else {
		return $(null);
	}
},

inputField: function() {
return this.tagInput;
},

containerDiv: function() {
return this.tagDiv;
},

// remove the div, and show original input
destroy: function() {
$.Widget.prototype.destroy.apply(this);
this.tagDiv.remove();
this.element.show();
}
});

$.widget("strath.criterion", {
	options: {
		editor: null,
		id: null,
		criterion: null
	},

	_create: function() {
		var self = this;
		$(self.element).addClass('strath-criterion');
		var icon = $("<span class='criterion-icon'/>");
		var removeButton = $(self.options.editor.icon('delete'))
			.click( function() {
				self.options.editor.remove(self);
		});
		var controls = $("<span class='criterion-controls'/>");
		controls.append( removeButton );
		this.element
			.append( controls )
			.append( icon )
			.append( $('<span>').addClass('label').text( self.options.text ) );
		$.ajax(
			{
				url: self.options.editor.options.ajaxScript,
				method: 'GET',
				dataType: 'json',
				data: { criteriatext: self.options.text },
				success: function(data){ return self._receiveCriteriaData(data, self); }
			}
		);
	},
	
	_isEditable: function() {
		if(!this.recipient) return false;
		if(this.recipient.type == 'registration_number') return false;
		if(this.recipient.type == 'ds_username') return false;
		return true;
	},
	
	_receiveCriteriaData: function(data, self) {
		recipients = data;
		if(recipients.length == 0) {
			$(self.element).find('.criterion-icon').html('<span class="warning" title="Recipient not found">!</span>');
		} else if(recipients.length == 1) {
			$(self.recipient = recipients[0]);
			$(self.element).attr('title', self.options.text);
			$(self.element).find('.label').text(self.recipient.label);
			$(self.element).find('.criterion-icon').append(self.options.editor.icon(self.recipient.type));
			if(self._isEditable()) {
				var settingsEditor = $('<span/>').criterionsettings({recipient: self.recipient, editor: self.options.editor});
				$(self.element).find('.criterion-controls').prepend(settingsEditor);
			};

		};
		
	}
	
});

$.widget("strath.criterionsettings", {
	options: {
		recipient: null,
		editor: null
	},

	_create: function() {
		var self = this;
		self.editButton = $(self.options.editor.icon('edit'))
			.click( function() {
				self._showEditor();
		});
		$(self.element).append(self.editButton);
		$(self.element).append(
				$('<div/>').addClass('criterion-settings').coursesettings(self.options)
		);
	},
	
	_showEditor: function() {
		var self = this;
		$(self.element).find('.criterion-settings')
			.toggle()
			.position({
				my: 'left top',
				at: 'left bottom',
				of: self.editButton,
				collision: 'none none',
				offset: '0 5'
			});
	}
	
});

$.widget('strath.coursesettings', {
	options: {
		recipient: null,
		editor: null
	},

	_create: function() {
		var self = this;
		var groupSelection = $('<div/>').addClass('group-selection').jstree({
			"json_data" : {
				"ajax" : {
					"url" : "http://localhost/moodle/mod/strathcom/criteria2/ajax.php?coursegroups=" + self.options.recipient.id,
					"data" : function (n) { 
						return { id : n.attr ? n.attr("id") : 0,
								type: n.attr ? n.attr("data-type") : 0}; 
					}
				},

				"progressive_render": true
			},
			"plugins" : [ "themes", "json_data", "checkbox", "sort", "ui" ]
		}).bind("loaded.jstree", function () {
			$(this).jstree("check_all");
			
			// Bind this after the initial check_all so it doesn't
			// keep firing after each
			$(this).bind("change_state.jstree", function() {
				self._updateCriteria(this);
			});
			
		});
		$(self.element).append(groupSelection);
	},
	
	_updateCriteria: function(tree) {
		var self = this;
		var recipient = self.options.recipient;
		var unchecked = $(tree).jstree("get_unchecked");
		
		// If everything's selected, just return a course criterion
		if(unchecked.length == 0) {
			recipient.criteria = [{ "type": "course", "value": recipient.id}];
		} else {
			var checked = $(tree).jstree("get_checked");
			recipient.criteria = [];
			for(var i = 0; i < checked.length; i++) {
				recipient.criteria.push({ "type": $(checked[i]).data('type'), "value": $(checked[i]).attr('id')});
			}
			
		}
		
		console.log(self);
	}
});

})(jQuery);