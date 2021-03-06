import React from 'react';

import {t} from 'app/locale';
import {fetchPlugins, enablePlugin, disablePlugin} from 'app/actionCreators/plugins';
import withPlugins from 'app/utils/withPlugins';
import ProjectPlugins from 'app/views/projectPlugins/projectPlugins';
import OrganizationIntegrations from 'app/views/organizationIntegrations';
import SentryTypes from 'app/proptypes';
import SettingsPageHeader from 'app/views/settings/components/settingsPageHeader';

class ProjectPluginsContainer extends React.Component {
  static propTypes = {
    plugins: SentryTypes.PluginsStore,
  };

  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    fetchPlugins(this.props.params);
  }

  handleChange = (pluginId, shouldEnable) => {
    let {projectId, orgId} = this.props.params;
    let actionCreator = shouldEnable ? enablePlugin : disablePlugin;
    actionCreator({projectId, orgId, pluginId});
  };

  render() {
    let {loading, error, plugins} = this.props.plugins || {};
    let {projectId, orgId} = this.props.params;

    return (
      <React.Fragment>
        <SettingsPageHeader title={t('Integrations')} />

        <OrganizationIntegrations
          {...this.props}
          hideHeader={true}
          linkPrefix={`/settings/${orgId}/${projectId}/integrations/`}
        />

        <ProjectPlugins
          {...this.props}
          onError={this.fetchData}
          onChange={this.handleChange}
          loading={loading}
          error={error}
          plugins={plugins}
        />
      </React.Fragment>
    );
  }
}

export default withPlugins(ProjectPluginsContainer);
