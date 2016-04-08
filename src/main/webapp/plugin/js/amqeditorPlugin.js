/**
 * @module AmqEditor
 * @mail AmqEditor
 *
 * The main entry point for the AmqEditor module
 *
 */
var AmqEditor = (function(AmqEditor) {

  /**
   * @property pluginName
   * @type {string}
   *
   * The name of this plugin
   */
  AmqEditor.pluginName = 'amqeditor_plugin';

  /**
   * @property log
   * @type {Logging.Logger}
   *
   * This plugin's logger instance
   */
  AmqEditor.log = Logger.get('AmqEditor');

  /**
   * @property contextPath
   * @type {string}
   *
   * The top level path of this plugin on the server
   *
   */
  AmqEditor.contextPath = "/amqeditor-plugin/";

  /**
   * @property templatePath
   * @type {string}
   *
   * The path to this plugin's partials
   */
  AmqEditor.templatePath = AmqEditor.contextPath + "plugin/html/";

  /**
   * @property module
   * @type {object}
   *
   * This plugin's angularjs module instance.  This plugin only
   * needs hawtioCore to run, which provides services like
   * workspace, viewRegistry and layoutFull used by the
   * run function
   */
  AmqEditor.module = angular.module('amqeditor_plugin', ['hawtioCore'])
      .config(function($routeProvider) {

        /**
         * Here we define the route for our plugin.  One note is
         * to avoid using 'otherwise', as hawtio has a handler
         * in place when a route doesn't match any routes that
         * routeProvider has been configured with.
         */
        $routeProvider.
            when('/amqeditor_plugin', {
              templateUrl: AmqEditor.templatePath + 'amqeditor.html'
            });
      });

  /**
   * Here we define any initialization to be done when this angular
   * module is bootstrapped.  In here we do a number of things:
   *
   * 1.  We log that we've been loaded (kinda optional)
   * 2.  We load our .css file for our views
   * 3.  We configure the viewRegistry service from hawtio for our
   *     route; in this case we use a pre-defined layout that uses
   *     the full viewing area
   * 4.  We configure our top-level tab and provide a link to our
   *     plugin.  This is just a matter of adding to the workspace's
   *     topLevelTabs array.
   */
  AmqEditor.module.run(function(workspace, viewRegistry, layoutFull) {

    AmqEditor.log.info(AmqEditor.pluginName, " loaded");

    Core.addCSS(AmqEditor.contextPath + "plugin/css/amqeditor.css");

    // tell the app to use the full layout, also could use layoutTree
    // to get the JMX tree or provide a URL to a custom layout
    viewRegistry["amqeditor_plugin"] = layoutFull;

    /* Set up top-level link to our plugin.  Requires an object
       with the following attributes:

         id - the ID of this plugin, used by the perspective plugin
              and by the preferences page
         content - The text or HTML that should be shown in the tab
         title - This will be the tab's tooltip
         isValid - A function that returns whether or not this
                   plugin has functionality that can be used for
                   the current JVM.  The workspace object is passed
                   in by hawtio's navbar controller which lets
                   you inspect the JMX tree, however you can do
                   any checking necessary and return a boolean
         href - a function that returns a link, normally you'd
                return a hash link like #/foo/bar but you can
                also return a full URL to some other site
         isActive - Called by hawtio's navbar to see if the current
                    $location.url() matches up with this plugin.
                    Here we use a helper from workspace that
                    checks if $location.url() starts with our
                    route.
     */
    workspace.topLevelTabs.push({
      id: "amqeditor",
      content: "AMQ Editor",
      title: "AMQ Editor",
      isValid: function(workspace) { return true; },
      href: function() { return "#/amqeditor_plugin"; },
      isActive: function(workspace) { return workspace.isLinkActive("amqeditor_plugin"); }

    });

  });

  /**
   * @function AmqEditorController
   * @param $scope
   * @param jolokia
   *
   * The controller for amqeditor.html, only requires the jolokia
   * service from hawtioCore
   *
   */
  AmqEditor.AmqEditorController = function($scope, jolokia) {
    $scope.hello = "Hello world!";
    $scope.cpuLoad = "0";
    $scope.updateResult = {};

    // register a watch with jolokia on this mbean to
    // get updated metrics
    Core.register(jolokia, $scope, {
      type: 'read', mbean: 'java.lang:type=OperatingSystem',
      arguments: []
    }, onSuccess(render));

    // update display of metric
    function render(response) {
      $scope.cpuLoad = response.value['ProcessCpuLoad'];
      Core.$apply($scope);
    }
    
    $scope.reloadAMQ = function() {
    	$scope.updateResult = jolokia.execute("org.apache.activemq:brokerName=amq,name=Plugin,service=RuntimeConfiguration,type=Broker", "updateNow()");
    }
  };

  return AmqEditor;

})(AmqEditor || {});

// tell the hawtio plugin loader about our plugin so it can be
// bootstrapped with the rest of angular
hawtioPluginLoader.addModule(AmqEditor.pluginName);