import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import {Flex, Box} from 'grid-emotion';

import Link from 'app/components/link';
import TextField from 'app/components/forms/textField';
import SelectField from 'app/components/forms/selectField';
import SelectControl from 'app/components/forms/selectControl';
import {t} from 'app/locale';

import {getInternal, getExternal, isValidCondition} from './utils';
import {CONDITION_OPERATORS} from '../data';

class Condition extends React.Component {
  static propTypes = {
    value: PropTypes.array,
    onChange: PropTypes.func,
    columns: PropTypes.array,
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedColumn: null,
      selectedOperator: null,
    };
  }

  focus() {
    this.select.focus();
  }

  handleChange = option => {
    if (new Set(this.props.columns.map(({name}) => name)).has(option.value)) {
      this.setState({selectedColumn: option.value}, this.focus);
    }
  };

  handleClose = () => {
    // Resets input
    this.setState({selectedColumn: null, selectedOperator: null});
  };

  getOptions() {
    const currentValue = getInternal(this.props.value);
    return [{label: currentValue, value: currentValue}];
  }

  filterOptions = (options, input) => {
    let optionList = options;
    const external = getExternal(input, this.props.columns);
    const isValid = isValidCondition(external, this.props.columns);

    if (isValid) {
      return [];
    }

    const hasSelectedColumn = external[0] !== null || this.state.selectedColumn !== null;
    const hasSelectedOperator =
      external[1] !== null || this.state.selectedOperator !== null;

    if (!hasSelectedColumn) {
      optionList = this.props.columns.map(({name}) => ({
        value: `${name}`,
        label: `${name}...`,
      }));
    }

    if (hasSelectedColumn && !hasSelectedOperator) {
      optionList = CONDITION_OPERATORS.map(op => {
        const value = `${external[0] || this.state.selectedColumn} ${op}`;
        return {
          value,
          label: value,
        };
      });
    }

    return optionList.filter(({label}) => label.includes(input));
  };

  isValidNewOption = ({label}) => {
    return isValidCondition(getExternal(label, this.props.columns), this.props.columns);
  };

  render() {
    return (
      <Box w={1}>
        <SelectControl
          forwardedRef={ref => (this.select = ref)}
          value={getInternal(this.props.value)}
          options={this.getOptions()}
          filterOptions={this.filterOptions}
          onChange={this.handleChange}
          closeOnSelect={true}
          openOnFocus={true}
          autoBlur={true}
          clearable={false}
          backspaceRemoves={false}
          deleteRemoves={false}
          onClose={this.handleClose}
          creatable={true}
          promptTextCreator={text => text}
          isValidNewOption={this.isValidNewOption}
        />
      </Box>
    );
  }
}

export default class Conditions extends React.Component {
  static propTypes = {
    value: PropTypes.arrayOf(PropTypes.array).isRequired,
    onChange: PropTypes.func.isRequired,
    columns: PropTypes.array,
  };

  constructor(props) {
    super(props);
    this.state = {
      editIndex: null,
    };
  }

  addRow() {
    const idx = this.props.value.length;
    this.setState({
      editIndex: idx,
    });
    this.props.onChange([...this.props.value, [null, null, null]]);
  }

  removeRow(idx) {
    const conditions = this.props.value.slice();
    conditions.splice(idx, 1);
    this.props.onChange(conditions);
  }

  updateCondition(idx, conditionIdx, val) {
    const conditions = this.props.value.slice();
    conditions[conditionIdx][idx] = val;

    // Handle IS NULL and IS NOT NULL
    const specialConditions = new Set(['IS NULL', 'IS NOT NULL']);
    if (idx === 1 && specialConditions.has(val)) {
      conditions[conditionIdx][2] = null;
    }

    // Handle IN condition
    if (idx === 1 && val === 'IN') {
      if (typeof conditions[conditionIdx][2] === 'string') {
        conditions[conditionIdx][2] = conditions[conditionIdx][2].split(',');
      } else if (!Array.isArray(conditions[conditionIdx][2])) {
        conditions[conditionIdx][2] = [];
      }
    }

    if (idx === 2 && conditions[conditionIdx][1] === 'IN') {
      conditions[conditionIdx][2] = conditions[conditionIdx][2]
        .split(',')
        .map(condition => {
          const col = this.props.columns.find(
            ({name}) => name === conditions[conditionIdx][0]
          );
          return col.type === 'number' ? parseInt(condition, 10) : condition;
        });
    }

    this.props.onChange(conditions);
  }

  getConditionOperators(condition) {
    const stringOperators = new Set(['=', '!=', 'IN', 'IS NULL', 'IS NOT NULL', 'LIKE']);

    return CONDITION_OPERATORS.filter(op => {
      const col = this.props.columns.find(({name}) => name === condition[0]);
      if (col && col.type === 'string') {
        return stringOperators.has(op);
      } else {
        return true;
      }
    }).map(op => ({
      value: op,
      label: op,
    }));
  }

  renderValueField(condition, idx) {
    const showValueField = condition[1] !== 'IS NULL' && condition[1] !== 'IS NOT NULL';

    if (!showValueField) return null;

    if (condition[1] === 'IN') {
      const value = condition[2].map(val => val.toString()).join(',');

      return (
        <TextField
          name="condition-3"
          placeholder={t('Add comma separated values')}
          value={value}
          onChange={val => this.updateCondition(2, idx, val)}
        />
      );
    } else {
      return (
        <TextField
          name="condition-3"
          value={condition[2]}
          onChange={val => this.updateCondition(2, idx, val)}
        />
      );
    }
  }

  saveRow(condition, idx) {
    const conditions = this.props.value.slice();
    conditions[idx] = condition;
    this.props.onChange(conditions);
    this.setState({
      editIndex: null,
    });
  }

  renderCondition(condition, idx) {
    const {columns} = this.props;

    return (
      <React.Fragment>
        <Box w={1 / 3} pr={1}>
          <SelectField
            name="condition-1"
            options={columns.map(({name}) => ({
              value: name,
              label: name,
            }))}
            value={condition[0]}
            onChange={val => this.updateCondition(0, idx, val)}
          />
        </Box>
        <Box w={1 / 3} pr={1}>
          <SelectField
            name="condition-2"
            options={this.getConditionOperators(condition)}
            value={condition[1]}
            onChange={val => this.updateCondition(1, idx, val)}
          />
        </Box>
        <Box w={1 / 3} pr={1}>
          {this.renderValueField(condition, idx)}
        </Box>
        <Box>
          <Save
            className="icon-circle-check"
            onClick={() => this.saveRow(condition, idx)}
            style={{lineHeight: '37px'}}
          />
          <a
            className="icon-circle-cross"
            style={{lineHeight: '37px'}}
            onClick={() => this.removeRow(idx)}
          />
        </Box>
      </React.Fragment>
    );
  }

  render() {
    const {value, columns} = this.props;

    return (
      <div>
        <div>
          <strong>{t('Conditions')}</strong>
          <Add>
            (<Link onClick={() => this.addRow()}>{t('Add')}</Link>)
          </Add>
        </div>
        {!value.length && 'None, showing all events'}
        {value.map((condition, idx) => (
          <Flex key={idx}>
            <Condition
              value={condition}
              onChange={val => this.handleChange(val, idx)}
              columns={columns}
            />
            <Box ml={1}>
              <a
                className="icon-circle-cross"
                style={{lineHeight: '37px'}}
                onClick={() => this.removeRow(idx)}
              />
            </Box>
          </Flex>
        ))}
      </div>
    );
  }
}

const Add = styled.span`
  font-style: italic;
  text-decoration: underline;
  margin-left: 4px;
  font-size: 13px;
  line-height: 16px;
  color: ${p => p.theme.gray1};
`;

const Save = styled(Link)`
  color: ${p => p.theme.green};
  :hover {
    color: ${p => p.theme.greenDark};
  }
`;
