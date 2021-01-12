/*global jQuery, Handlebars, Router */

	'use strict';


	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;
  var TAB_KEY = 9;
  
  
	var util = {
		
    //remove
    
    
    uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				
        if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
     
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			
      } else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
     
			this.bindEvents();

      new Router({
				'/:filter': function (filter) {
					this.filter = filter;
				//	this.render();
				}.bind(this)
			}).init('/all');      
		},
    
		bindEvents: function () {
			document.getElementById('new-todo').addEventListener('keyup', this.create.bind(this));
			document.getElementById('toggle-all').addEventListener('change', this.toggleAll.bind(this));
		  document.getElementById('footer').addEventListener('click', this.footerClick);
      document.getElementById('todo-list').addEventListener('click', this.click);
      document.getElementById('todo-list').addEventListener('dblclick', this.dblclick);
      document.getElementById('todo-list').addEventListener('keyup', this.keyup);
      document.getElementById('todo-list').addEventListener('focusout', this.focusout);
		},
		
    footerClick: function() {
      if(event.target.classList.contains('clear-completed')) {
        App.destroyCompleted();
      }
    },
    
    click: function() {
      if(event.target.classList.contains('toggle')) {
        App.toggle(event);
        
      } else if (event.target.classList.contains('destroy')) {
        App.destroy(event);
        
      } else {
        return;
      }
    },
    
    dblclick: function() {
      if (event.target.nodeName === 'LABEL') {
        App.edit(event);
      }
    },
    
    keyup: function() {
      if (event.target.classList.contains('edit')) {
        App.editKeyup(event);
      }
    },
    
    focusout: function(){
      if (event.target.classList.contains('edit')) {
        App.update(event);
        
      } else {
        return;
      }
    },
    
    render: function () {
			var todos = this.getFilteredTodos();
      var todosUl = document.getElementById('todo-list');
      todosUl.innerHTML = '';
      
      if (todos.length > 0) {
        for (var i = 0; i < todos.length; i++) {
          var todoLi = document.createElement('li');
          todoLi.id = todos[i].id;
          
          if (todos[i].completed) {
             todoLi.classList.add("completed");
            }
          
          var label = document.createElement("label");
          label.innerHTML = todos[i].title;
          
          var divElem = document.createElement("div");
          divElem.classList.add("view");
          
          var inputElem = document.createElement("input");
          inputElem.classList.add("toggle");
          inputElem.type = "checkbox"; 
          
          if(todos[i].completed) {
            inputElem.checked = true;
          }
          
          var deleteButton = document.createElement("button");
          deleteButton.classList.add("destroy");
          
          var editInput = document.createElement("input");
          editInput.classList.add("edit");
          editInput.value = todos[i].title;
          
          divElem.appendChild(inputElem);
          divElem.appendChild(label);
          divElem.appendChild(deleteButton);
          
          todoLi.appendChild(divElem);
          todoLi.appendChild(editInput);
          
          todosUl.appendChild(todoLi);
        }
      }
      
      if (todos.length > 0) {
        document.getElementById("main").style.display = "block";
        
      } else {
        document.getElementById("main").style.display = "none";
      }
    
      document.getElementById('toggle-all').checked = this.getActiveTodos().length === 0;

      this.renderFooter();
		
      document.getElementById('new-todo').focus();
			util.store('todos-jquery', this.todos);
		},
    
		renderFooter: function() {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var filterobj = {
        all: false,
        active: false,
        completed: false,
      };
      
      var activeTodoWord = util.pluralize(activeTodoCount, 'item');
      
      if (this.filter === 'all') {
        filterobj.all = true;
        
      } else if (this.filter === 'active') {
        filterobj.active = true;
        
      } else {
        filterobj.completed = true;
      }

      if (todoCount > 0) {
        document.getElementById('footer').style.display = "block";
     
      } else {
        document.getElementById('footer').style.display = "none";
      }
      
      document.getElementById('all-footer').className='';   
      document.getElementById('active-footer').className='';   
      document.getElementById('completed-footer').className='';   

      if (filterobj.all) {
        document.getElementById('all-footer').classList.add('selected');
        
      } else if(filterobj.active) {
        document.getElementById('active-footer').classList.add('selected');
        
      } else {
        document.getElementById('completed-footer').classList.add('selected');
      }
      
      //adds in clear completed button
      if (this.getCompletedTodos().length > 0) {
        document.getElementById("clear-completed").style.display="block";
      
      } else {
        document.getElementById("clear-completed").style.display="none";
      }
      
      document.getElementById('todo-count').innerHTML = (activeTodoCount + ' ' + activeTodoWord + ' left');
		},
    
		toggleAll: function(event) {
			var isChecked = event.target.checked;

			this.todos.forEach(function(todo) {
				todo.completed = isChecked;
			});

			this.render();
		},
    
		getActiveTodos: function() {
			return this.todos.filter(function(todo) {
				return !todo.completed;
			});
		},
    
		getCompletedTodos: function() {
			return this.todos.filter(function(todo) {
				return todo.completed;
			});
		},
    
		getFilteredTodos: function() {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
    
		destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		},
    
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function() {
			var id = event.target.closest('li').id; //added id to li elements in todo-template
      var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
    
		create: function(e) {
			var input = document.getElementById('new-todo');
			var val = input.value.trim();

			if (e.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false,
        nestLevel: 0
			});

			input.value = '';

			this.render();
		},
    
		toggle: function(e) {
			var i = this.indexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},
  
		edit: function(e) {
      event.target.closest('li').classList.add('editing');
      event.target.closest('li').children[1].focus();
		},
    
		editKeyup: function(event) {	
      var el = event.target;
      
      if (event.which === ENTER_KEY) {
				event.target.blur();
			}
      
      if (event.which === ESCAPE_KEY) {
				event.target.classList.add('abort')
        event.target.blur();
			}
      
      if (event.which === TAB_KEY) {
        this.todos[this.indexFromEl(el)].nestLevel++;
      }
		},
    
		update: function(e) {
			var el = e.target;
			var val = e.target.value.trim();

			if (!val) {
				this.destroy(e);
				return;
			}

			if (e.target.classList.contains('abort')) {
				e.target.classList.remove('abort');
        
			} else {
				this.todos[this.indexFromEl(el)].title = val;
			}

			this.render();
		},
    
		destroy: function (event) {
			this.todos.splice(this.indexFromEl(event.target), 1);
			this.render();
		}
	};

	App.init();
