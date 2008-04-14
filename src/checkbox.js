Form.Element.Serializers.inputSelector = function(element, value) {
  if (Object.isUndefined(value)) {
    if (element.value == "") {
      return element.checked;
    } else {
      return element.checked ? element.value : null;
    }
  } else {
    if (element.value == "") {
      element.checked = !!value;
    } else {
      element.checked = element.value == value;
    }
  }
};
