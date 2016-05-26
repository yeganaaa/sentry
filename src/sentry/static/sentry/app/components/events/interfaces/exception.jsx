import React from 'react';
import ConfigStore from '../../../stores/configStore';
import GroupEventDataSection from '../eventDataSection';
import PropTypes from '../../../proptypes';
import ExceptionContent from './exceptionContent';
import RawExceptionContent from './rawExceptionContent';
import {t} from '../../../locale';

const ExceptionInterface = React.createClass({
  propTypes: {
    group: PropTypes.Group.isRequired,
    event: PropTypes.Event.isRequired,
    type: React.PropTypes.string.isRequired,
    data: React.PropTypes.object.isRequired,
  },

  getInitialState() {
    let user = ConfigStore.get('user');
    // user may not be authenticated
    let options = user ? user.options : {};
    let platform = this.props.event.platform;
    let newestFirst;
    switch (options.stacktraceOrder) {
      case 'newestFirst':
        newestFirst = true;
        break;
      case 'newestLast':
        newestFirst = false;
        break;
      case 'default':
      default:
        newestFirst = (platform !== 'python');
    }

    return {
      stackView: (this.props.data.hasSystemFrames ? 'app' : 'full'),
      stackType: 'original',
      newestFirst: newestFirst
    };
  },

  toggleStackView(value) {
    this.setState({
      stackView: value
    });
  },


  render() {
    let group = this.props.group;
    let evt = this.props.event;
    let data = this.props.data;
    let stackView = this.state.stackView;
    let stackType = this.state.stackType;
    let newestFirst = this.state.newestFirst;

    let hasMinified = data.values.find(x => !!x.rawStacktrace);

    let title = (
      <div>
        <div className="btn-group" style={{marginLeft:'10px'}}>
          {data.hasSystemFrames &&
            <a className={(stackView === 'app' ? 'active' : '') + ' btn btn-default btn-sm'} onClick={this.toggleStackView.bind(this, 'app')}>{t('App Only')}</a>
          }
          <a className={(stackView === 'full' ? 'active' : '') + ' btn btn-default btn-sm'} onClick={this.toggleStackView.bind(this, 'full')}>{t('Full')}</a>
          <a className={(stackView === 'raw' ? 'active' : '') + ' btn btn-default btn-sm'} onClick={this.toggleStackView.bind(this, 'raw')}>{t('Text')}</a>
        </div>
        <div className="btn-group">
          {hasMinified &&
            <span>
              <a className={(stackType === 'original' ? 'active' : '') + ' btn btn-default btn-sm'} onClick={this.setState.bind(this, {stackType: 'original'})}>{t('Original')}</a>
              <a className={(stackType === 'minified' ? 'active' : '') + ' btn btn-default btn-sm'} onClick={this.setState.bind(this, {stackType: 'minified'})}>{t('Minified')}</a>
            </span>
          }
        </div>
        <h3>
          {t('Exception')}
          <small style={{marginLeft: 5}}>
            {newestFirst ?
              t('most recent call first')
            :
              t('most recent call last')
            }
          </small>
        </h3>
      </div>
    );

    return (
      <GroupEventDataSection
          group={group}
          event={evt}
          type={this.props.type}
          title={title}
          wrapTitle={false}>
        {/*stackType === 'original' ?
        */}
        {stackView === 'raw' ?
          <RawExceptionContent
            values={data.values}
            platform={evt.platform}/> :

          <ExceptionContent
            type={this.state.stackType}
            view={stackView}
            values={data.values}
            platform={evt.platform}
            newestFirst={newestFirst}/>
        }
      </GroupEventDataSection>
    );
  }
});

export default ExceptionInterface;
