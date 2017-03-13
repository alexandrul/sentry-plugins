import React from 'react';
import {i18n, IndicatorStore, LoadingError, LoadingIndicator, plugins, Switch} from 'sentry';

class Settings extends plugins.BasePlugin.DefaultSettings {
  constructor(props) {
    super(props);

    this.testConfig = this.testConfig.bind(this);
    this.fetchData = this.fetchData.bind(this);

    Object.assign(this.state, {
      testing: false,
      twoFARequest: false,
    });
  }

  fetchData() {
    super.fetchData();
    this.api.request(`${this.getPluginEndpoint()}test-config/`, {
      success: (data) => {
        this.setState({
          testResults: data,
        });
      }
    });
  }

  sendAuthCode(code) {
    console.log(code);
    this.api.request(`${this.getPluginEndpoint()}securitycode/`, {
      method: 'POST',
      data: {
        securitycode: code,
      },
      success: (data) => {
        this.testConfig();
      }
    });
  }

  testConfig() {
    if (this.state.testing !== false) {
      return;
    }
    this.setState({
      testing: true,
    });
    let loadingIndicator = IndicatorStore.add(i18n.t('Syncing account...'));
    this.api.request(`${this.getPluginEndpoint()}test-config/`, {
      method: 'POST',
      success: (data) => {
        if (data.twoFARequest) {
          let code = prompt("Please enter your code", "");
          if (code != null) {
            this.sendAuthCode(code);
          }
        } else {
          console.log(data);
          this.setState({
            testResults: data,
          });
        }
      },
      error: (error) => {
        this.setState({
          testResults: {
            error: true,
            message: 'An unknown error occurred while testing this integration.',
          },
        });
      },
      complete: () => {
        IndicatorStore.remove(loadingIndicator);
        this.setState({
          testing: false,
        });
      }
    });
  }

  renderTeam(team) {
    return (
      <li className="group" key={team.id}>
        <div className="row">
          <div className="col-xs-12 event-details">
            <h3 className="truncate">{team.name}</h3>
            <div className="event-message">{team.roles.join(', ')}</div>
            <div className="event-extra">
              <ul>
                <li>
                  ID: {team.id}
                </li>
              </ul>
            </div>
          </div>
        </div>
        {team.apps.map((app) => {
          return (
            <div className="row" key={app.id}>
              <div className="col-xs-8 event-details">
                <div className="event-message">
                  {app.name}
                </div>
                <div className="event-extra">
                  <ul>
                    <li>
                      {app.bundle_id}
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-xs-4 event-details">
                <div className="event-message">
                  <span className="align-right pull-right" style={{paddingRight: 16}}>
                    <Switch size="lg"
                      isActive={true}
                      isLoading={false}
                      toggle={() => {
                        console.log('asd');
                      }} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </li>
    );
  }

  renderUserDetails() {
    if (!this.props.plugin.enabled) {
      return null;
    }
    let hasResult = false;
    let cachedResult = false;
    if (this.state.testResults && this.state.testResults.result) {
      cachedResult = this.state.testResults.cached;
      hasResult = true;
    }
    return (
      <div className="box dashboard-widget">
        <div className="box-header clearfix">
          <div className="row">
            <div className="col-xs-8">
              <h3>{i18n.t('Team')}</h3>
            </div>
            <div className="col-xs-4">
              <a className="pull-right btn btn-default btn-sm"
                onClick={this.testConfig}
                disabled={this.state.testing}>
                {i18n.t('Sync Account')}
              </a>
            </div>
          </div>
        </div>
        <div className="box-content">
          <div className="tab-pane active">
              {hasResult &&
                <ul className="group-list group-list-small">
                  {this.state.testResults.result.teams.map((team) => {
                      return this.renderTeam(team);
                  })}
                </ul>
              }
          </div>
        </div>
      </div>
    );
  }

  render() {
    let metadata = this.props.plugin.metadata;

    return (
      <div>
        <div className="ref-itunesconnect-settings">
          {this.props.children}
        </div>

        {this.state.testResults &&
          <div className="ref-itunesconnect-test-results">
            {this.state.testResults.error &&
              <div className="alert alert-block alert-error">
                {this.state.testResults.message}
                <pre>{this.state.testResults.exception}</pre>
              </div>
            }
          </div>
        }
        {this.renderUserDetails()}
      </div>
    );
  }
}

export default Settings;