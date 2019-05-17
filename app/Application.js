/**
 * The main application class. An instance of this class is created by app.js when it
 * calls Ext.application(). This is the ideal place to handle application launch and
 * initialization details.
 */

var APIURL = "https://localhost:44332/Api/";
var GETID = 'Auth/GetId';
var LOGINVIEW = 'Auth/ViewLogin';
var LOGINPOST = 'Auth/Login';
var HOMEVIEW = 'Menu/ViewMenu';
var DATACATALOGS = 'Catalog/GetData';
var MESSAGEERROR = 'Ocurrio un error por favor notifiquelo al administrador';
var GETVIEWS = APIURL + "Views/{0}/view/{1}";

var myMask;

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
        console.log("onGetIdApp");

        var loggedIn;
        var appId;
        var currentThis = this;
        loggedIn = localStorage.getItem("LoggedIn");

        console.log(loggedIn);
        if (!(loggedIn == 'true')) {
            console.log("onGetIdApp3");
            console.log(APIURL + GETID);

            Ext.Ajax.request({
                url: APIURL + GETID,
                method: 'POST',
                params: location.href,
                success: function(response, opts) {
                    console.log("onGetIdApp ajax");
                    var obj = Ext.decode(response.responseText);
                    localStorage.setItem("AppID", obj.id);
                    currentThis.onGetViewLogin();
                },

                failure: function(response, opts) {
                    window.alert("Error");
                }
            });
        } else {
            console.log("onGetIdApp2");

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

        if (myMask) {
            myMask.show();
        }

        Ext.Ajax.request({
            url: url,
            method: method,
            jsonData: data,
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);

                if (obj.success) {
                    currentThis.onCreateView(obj, bind);
                    if (myMask) {
                        myMask.hide();
                    }
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

            myMask = new Ext.LoadMask({
                msg    : 'Se esta generando su vista...',
                target : this.currentView
            });


        } else {
            var cont = Ext.getCmp(bind);
            console.log(cont);
            cont.removeAll(true);
            cont.updateLayout();
            cont.add(itemComp);
        }
    },

    onCreateComponent: function(comp) {
        var currentThis = this;

        var extComponent = {
            id: comp.componentId,
            xtype: comp.componentType
        };

        if (comp.mapping) {
            extComponent.dataIndex = comp.mapping.field;
        }

        for (var b in comp.attributes) {
            if ((comp.attributes[b].attributeValue == "true") || (comp.attributes[b].attributeValue == "false") ||
                (comp.attributes[b].attributeValue == "True") || (comp.attributes[b].attributeValue == "False") ||
                (comp.attributes[b].attributeValue == "FALSE") || (comp.attributes[b].attributeValue == "FALSE")) {
                comp.attributes[b].attributeValue = comp.attributes[b].attributeValue.toLowerCase();
                extComponent[comp.attributes[b].attributeName] = (comp.attributes[b].attributeValue === "true");
            } else {
                extComponent[comp.attributes[b].attributeName] = comp.attributes[b].attributeValue;
            }
        }

        for (var b in comp.Components) {
            var type = comp.Components[b].type;
            var componente = comp.Components[b].items;

            if (type != undefined) {
                extComponent[type] = [];
            } else {
                extComponent.items = [];
            }

            for (var c in componente) {
                var extCreateComponente = componente[c];
                var itemComp = this.onCreateComponent(extCreateComponente);
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

            for (var c in cmpEvent.behaviours) {
                
                if (cmpEvent.eventName != "create") {
                    var evetBehaviors = cmpEvent.behaviours[c];

                    var event = [];
                    event[cmpEvent.eventName] = function() {
                        var parametros = [];

                        for (var d in evetBehaviors.parameters) {
                            var param = evetBehaviors.parameters[d];
                            console.log(param);
                            parametros[param.parameterName] = param.parameterValue;
                        }

                        var fun = "MAGAJOWeb.app." + evetBehaviors.behaviourId + "(this, parametros)";
                        console.log(fun);

                        eval(fun);
                    }

                    extComponent.listeners.push(event);
                }
            }
        }

        if (comp.listOfValues) {
            this.onListOfValuesAjax(extComponent, comp);
            extComponent.store = Ext.data.StoreManager.lookup(comp.listOfValues.entity);
        }

        return extComponent;
    },

    onListOfValuesAjax: function(extCmp, dataCmp) {
        var apiUrl = APIURL + DATACATALOGS;

        var dataParametros = {
            IEntityID: dataCmp.listOfValues.entity,
            Itoken: localStorage.getItem("UserToken"),
            FilterData: null,
            SortData: null,
            QueryLimits: null,
            ColumnData: null,
            MGJAPP_ID: localStorage.getItem("AppID")
        }

        Ext.Ajax.request({
            url: apiUrl,
            async: false,
            method: 'POST',
            jsonData: dataParametros,
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);

                Ext.create('Ext.data.Store', {
                    storeId: dataCmp.listOfValues.entity,
                    autoLoad: true,
                    fields: obj.model,
                    data: obj.data.data
                });

            },
            failure: function(response, opts) {
                Ext.MessageBox.alert('Error', MESSAGEERROR);
            }
        });
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
        console.log("onCargarVista");
        console.log(parametros);
        var appId = localStorage.getItem("AppID");
        var apiUrl = APIURL + 'Views/' + appId + '/view/' + parametros.Vista;
        this.onGetAjaxView(apiUrl, 'GET', null, parametros.Container);
    },

    onCerrarSesion: function(obj, parametros) {
        localStorage.setItem("AppID", null);
        localStorage.setItem("UserToken", null);
        localStorage.setItem("LoggedIn", false);
        this.onGetIdApp();
    },

    onDialogoVista: function(obj, parametros) {
        if (myMask) {
            myMask.show();
        }

        var currentThis = this;
        var appId = localStorage.getItem("AppID");

        var url = GETVIEWS.replace("{0}", appId);
        url = url.replace("{1}", parametros.Vista);
        
        console.log(url);

        Ext.Ajax.request({
            url: url,
            method: 'GET',
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);

                console.log(obj);

                if (obj.success) {
                    var itemComp = [];

                    for (var b in obj.Components) {
                        itemComp.push(currentThis.onCreateComponent(obj.Components[b]));
                    }

                    Ext.create('Ext.window.Window', {
                        title: obj.ViewName,
                        layout: 'fit',
                        autoDestroy: true,
                        items: itemComp
                    }).show();
                } else {
                    Ext.MessageBox.alert('Error', obj.message);
                }

                if (myMask) {
                    myMask.hide();
                }
            },

            failure: function(response, opts) {
                window.alert("Error");
                if (myMask) {
                    myMask.hide();
                }
            }
        });

    },

    onMuestraExplosionInsumos: function(obj, parametros) {
        console.log(parametros);
    },

    onGuardarEntidades: function(obj, parametros) {
        console.log(parametros);
    },

    onLoadChange: function(obj, parametros) {
        /*var idParent = parametros.FieldIDParent

        var jsonData = {
            condition = "AND",
            filters = [
                {
                    field = idParent,
                    values: [
                        Ext.getCmp(idParent).getValue()
                    ],
                    operator: "="
                }
            ]
        }

        for (var b in parametros.FieldID) {
            

        }*/
    }
});
