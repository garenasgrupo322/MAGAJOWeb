/**
 * The main application class. An instance of this class is created by app.js when it
 * calls Ext.application(). This is the ideal place to handle application launch and
 * initialization details.
 */

var APIURL = "https://localhost:5001/Api/";
var GETID = 'Auth/GetId';
var LOGINVIEW = 'Auth/ViewLogin';
var LOGINPOST = 'Auth/Login';
var HOMEVIEW = 'Menu/ViewMenu';
var MESSAGEERROR = 'Ocurrio un error por favor notifiquelo al administrador';

var body = document.body,
    html = document.documentElement;

var HEIGHT = Math.max(body.scrollHeight, body.offsetHeight,
    html.clientHeight, html.scrollHeight, html.offsetHeight);

Ext.define('MAGAJOWeb.Application', {
    extend: 'Ext.app.Application',

    name: 'MAGAJOWeb',

    quickTips: false,
    platformConfig: {
        desktop: {
            quickTips: true
        }
    },

    stores: [
        // TODO: add global / shared stores here
    ],

    currentView: null,

    launch: function() {
        // TODO - Launch the application
        this.onGetIdApp();
    },

    onAppUpdate: function() {
        Ext.Msg.confirm('Application Update', 'This application has an update, reload?',
            function(choice) {
                if (choice === 'yes') {
                    window.location.reload();
                }
            }
        );
    },

    onGetIdApp: function() {
        var loggedIn;
        var appId;
        var currentThis = this;
        loggedIn = localStorage.getItem("LoggedIn");

        if (!loggedIn) {
            Ext.Ajax.request({
                url: APIURL + GETID,
                method: 'POST',
                params: location.href,
                success: function(response, opts) {
                    var obj = Ext.decode(response.responseText);
                    localStorage.setItem("AppID", obj.id);
                    console.log('onGetIdApp')
                    currentThis.onGetViewLogin();
                },

                failure: function(response, opts) {
                    window.alert("Error");
                }
            });
        } else {
            this.onCreateHome();
        }
    },

    onGetViewLogin: function() {
        var appId = localStorage.getItem("AppID");
        if (appId != '') {
            var apiUrl = APIURL + LOGINVIEW + '/' + appId;
            this.onGetAjaxView(apiUrl, 'GET', null, null);
        }
    },

    onGetAjaxView: function(url, method, data, bind) {
        var currentThis = this;

        Ext.Ajax.request({
            url: url,
            method: method,
            jsonData: data,
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);

                if (obj.success) {
                    currentThis.onCreateView(obj, bind);
                } else {
                    Ext.MessageBox.alert('Error', obj.message);
                }
            },

            failure: function(response, opts) {
                window.alert("Error");
            }
        });
    },

    onCreateView: function(obj, bind) {

        if (this.currentView && bind == null)
            this.currentView.destroy();

        var itemComp = [];
        var currentThis = this;

        for (var b in obj.Components) {
            itemComp.push(this.onCreateComponent(obj.Components[b]));
        }


        console.log(itemComp);

        if (bind == null) {
            this.currentView = Ext.create('Ext.panel.Panel', {
                renderTo: Ext.getBody(),
                title: 'MAGAJOWeb',
                layout: 'border',
                width: '100%',
                height: HEIGHT,
                items: itemComp
            });
        } else {
            var cont = Ext.getCmp(bind);
            cont.add(itemComp);
        }
    },

    onCreateComponent: function(comp) {
        console.log("inicio");
        var currentThis = this;

        var extComponent = {
            id: comp.componentId,
            xtype: comp.componentType
        };

        for (var b in comp.attributes) {
            if ((comp.attributes[b].attributeValue == "true") || (comp.attributes[b].attributeValue == "false")
                || (comp.attributes[b].attributeValue == "True") || (comp.attributes[b].attributeValue == "False")
                || (comp.attributes[b].attributeValue == "FALSE") || (comp.attributes[b].attributeValue == "FALSE")) {
                comp.attributes[b].attributeValue = comp.attributes[b].attributeValue.toLowerCase();
                extComponent[comp.attributes[b].attributeName] = (comp.attributes[b].attributeValue === "true");
            } else {
                extComponent[comp.attributes[b].attributeName] = comp.attributes[b].attributeValue;
            }
        }

        /*if (comp.Components)
            extComponent.items = [];*/

            
        /*for (var b in comp.Components) {
            var type = comp.Components[b].type;
            console.log(type);
            console.log(comp.Components[b][comp.Components[b].type]);
            var itemComp = this.onCreateComponent(comp.Components[b][comp.Components[b].type]);
            if (comp.type != undefined) {
                console.log
                extComponent[comp.Components[b].type].push(itemComp);
            } else {
                extComponent.items.push(itemComp);
            }
        }*/

        for (var b in comp.Components) {
            //console.log(comp.Components[b]);
            var type = comp.Components[b].type;
            console.log(type);
            var componente = comp.Components[b].items;
            console.log("componente");
            console.log(componente);

            if (type != undefined) {
                extComponent[type] = [];
            } else {
                extComponent.items = [];
            }

            console.log(extComponent);
            
            for (var c in componente) {
                var extCreateComponente = componente[c];
                var itemComp = this.onCreateComponent(extCreateComponente);
                console.log(type);
                if (type != undefined) {
                    extComponent[type].push(itemComp);
                } else {
                    extComponent.items.push(itemComp);
                }
            }
        }

        if (comp.events) {
            if (comp.events.length > 0) {
                extComponent.listeners = [];
            }
        }

        for (var b in comp.events) {
            var cmpEvent = comp.events[b];
            for (var b in cmpEvent.behaviours) {
                var event = [];
                var fun = "MAGAJOWeb.app." + cmpEvent.behaviours[b].behaviourId + "(this, parametros)";
                console.log(Ext.get(currentThis.getId().toString()));
                event[cmpEvent.eventName] = function() {
                    var parametros = [];

                    for (var c in cmpEvent.behaviours[b].parameters) {
                        var param = cmpEvent.behaviours[b].parameters[c];

                        parametros[param.parameterName] = param.parameterValue;
                    }

                    eval(fun);
                }
                extComponent.listeners.push(event);
            }
        }

        return extComponent;
    },

    onIniciaSesion: function(obj, parametros) {
        var currentThis = this;

        var form = obj.ownerCt.ownerCt.getForm();

        if (form.isValid()) {

            var apiUrlLogin = APIURL + LOGINPOST;

            var pms = form.getValues();

            var logn = {
                'appId': localStorage.getItem("AppID"),
                'userName': pms['ERPZANTELOGIN0000000000000000000000000000000000004-inputEl'],
                'userPassword': pms['ERPZANTELOGIN0000000000000000000000000000000000005-inputEl']
            }

            Ext.Ajax.request({
                url: apiUrlLogin,
                method: 'POST',
                jsonData: logn,
                success: function(response, opts) {
                    var obj = Ext.decode(response.responseText);

                    if (obj.success) {
                        localStorage.setItem("LoggedIn", true);
                        localStorage.setItem("UserToken", obj.token);
                        currentThis.onCreateHome();
                    } else {
                        Ext.MessageBox.alert('Error', obj.message);
                    }
                },

                failure: function(response, opts) {
                    var obj = Ext.decode(response.responseText);

                    if (obj.message) {
                        Ext.MessageBox.alert('Error', obj.message);
                    } else {
                        Ext.MessageBox.alert('Error', MESSAGEERROR);
                    }
                }
            });
        }
    },

    onCreateHome: function() {
        var appId = localStorage.getItem("AppID");
        var apiUrl = APIURL + HOMEVIEW + '/' + appId;
        this.onGetAjaxView(apiUrl, 'GET', null, null);
    },

    onCargarVista: function(obj, parametros) {
        var appId = localStorage.getItem("AppID");
        var apiUrl = APIURL + 'Views/' + appId + '/view/' + parametros.Vista;
        this.onGetAjaxView(apiUrl, 'GET', null, parametros.Container);
    }
});