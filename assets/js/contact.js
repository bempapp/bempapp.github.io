
(function ($) {
  "use strict";

  function inputValid(input) {
    var value = $(input).val().trim();
    if ($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
      return !(value.match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null);
    } else {
      return value.length > 3;
    }
  }

  function formValid() {
    var inputs = $('.validate-input .form-control');
    var valid = true;
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      if (inputValid(input) == false) {
        showValidate(input);
        valid = false;
      } else {
        hideValidate(input);
      }
    }
    return valid;
  }

  function showValidate(input) {
    $(input).parent().addClass('alert-validate');
  }

  function hideValidate(input) {
    $(input).parent().removeClass('alert-validate');
  }

  function getFormData(form) {
    var elements = form.elements;

    var fields = Object.keys(elements).filter(function (k) {
      return (elements[k].name !== "honeypot");
    }).map(function (k) {
      if (elements[k].name !== undefined) {
        return elements[k].name;
        // special case for Edge's html collection
      } else if (elements[k].length > 0) {
        return elements[k].item(0).name;
      }
    }).filter(function (item, pos, self) {
      return self.indexOf(item) == pos && item;
    });

    var formData = {};
    fields.forEach(function (name) {
      var element = elements[name];

      // singular form elements just have one value
      formData[name] = element.value;

      // when our element has multiple items, get their values
      if (element.length) {
        var data = [];
        for (var i = 0; i < element.length; i++) {
          var item = element.item(i);
          if (item.checked || item.selected) {
            data.push(item.value);
          }
        }
        formData[name] = data.join(', ');
      }
    });

    // add form-specific values into the data
    formData.formDataNameOrder = JSON.stringify(fields);
    formData.formGoogleSheetName = form.dataset.sheet || "responses"; // default sheet name
    formData.formGoogleSendEmail = form.dataset.email || ""; // no email by default

    return formData;
  }

  function savePipefy(data) {
    var payload = `
      mutation { 
        createCard(
          input: {
            pipe_id: 301858572,
            label_ids: ["305926550"],
            fields_attributes:[
              { field_id: "nome", field_value: "${data.name}"},
              { field_id:"email", field_value: "${data.email}"},
              { field_id:"n_mero_de_telefone", field_value: "${data.phone}"},
              { field_id:"nome_da_empresa", field_value: "${data.organization}"},
              { field_id:"mensagem", field_value: "${data.message}"}
            ]
          }
        )
        { card {id} }
      }
    `
    var options = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJ1c2VyIjp7ImlkIjozMDE0MzMzOTAsImVtYWlsIjoiY2VudGVub0BiZW1wLmNvbS5iciIsImFwcGxpY2F0aW9uIjozMDAxMTkyMzd9fQ.seaN9fW5gwTX2zBDt1ttUx4bscrQ3IQ701juv7GXayO0t7kB58cT6eF_BE-o2dbRamGAaAR6OHhvKFpUwZPjtg',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: payload })
    }
  
    return fetch('https://api.pipefy.com/graphql', options)
      .then(response => response.json())
      .then(response => {
        if (response.errors !== undefined) {
          throw response.errors
        }
      })
  }

  function onSuccess() {
    $('#gform').hide();
    $('#contact-overlay').removeClass('d-flex');
    $('#contact-overlay').addClass('d-none');
    $('#success').removeClass('d-none');
    $('#success').addClass('d-block');
  }
  
  function onError(data) {
    $('#gform').hide();
    $('#contact-overlay').removeClass('d-flex');
    $('#contact-overlay').addClass('d-none');
    $('#error').removeClass('d-none');
    $('#error').addClass('d-block');
    console.log("error", data);
  }

  $('#gform').on("submit", function (event) {
    event.preventDefault();

    if (!formValid()) return false;

    $('#contact-overlay').removeClass('d-none');
    $('#contact-overlay').addClass('d-flex');

    var data = getFormData(event.target);
    
    savePipefy(data).then(response => onSuccess()).catch(err => onError(err));
  });
})(jQuery);
