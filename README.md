# Disclaimer

This software is developed solely for integration with Russian government IT systems, so the Cyrillic script is widely used in its documentation.

# Описание

Во многих информационных системах, разработанных для рынка [РФ](https://ru.wikipedia.org/w/index.php?title=%D0%A0%D0%BE%D1%81%D1%81%D0%B8%D0%B9%D1%81%D0%BA%D0%B0%D1%8F_%D0%A4%D0%B5%D0%B4%D0%B5%D1%80%D0%B0%D1%86%D0%B8%D1%8F), есть такой объект данных, как _платёжные реквизиты_, а именно:
* номер расчётного счёта;
* [БИК](https://ru.wikipedia.org/wiki/%D0%91%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B8%D0%B9_%D0%B8%D0%B4%D0%B5%D0%BD%D1%82%D0%B8%D1%84%D0%B8%D0%BA%D0%B0%D1%86%D0%B8%D0%BE%D0%BD%D0%BD%D1%8B%D0%B9_%D0%BA%D0%BE%D0%B4) + всё, что с ним связано: номер корреспондентского счёта, наименование (филиала) банка и т. д.

Необходимый для корректного ввода актуальный реестр БИК доступен на официальном сайте ЦБ РФ по ссылке http://www.cbr.ru/s/newbik.

По этой ссылке предлагается на скачивание ZIP-архив, содержащий единственный XML-документ, корневой элемент которого имеет тип `ED807` из пространства имён `urn:cbr-ru:ed:v2.0`.

Схема XML является составной частью Унифицированных форматов электронных банковских сообщений Банка России (УФЭБС), документация на которые доступна по адресу http://www.cbr.ru/development/Formats/.

Библиотека `ru-cbr-newbik` позволяет node.js-приложению получить содержимое такого ZIP-архива в виде потока объектов, набор и структура которых оптимизированы для использования в качестве справочника для ввода платёжных реквизитов.

# Установка
```sh
npm install ru-cbr-newbik
```
# Как использовать

```js
const {RuCBRNewBikReader} = require ('ru-cbr-newbik')

const reader = await RuCBRNewBikReader.fromFile ('20220119ED01OSBR.zip', {
  // lowercase: true,                                                // приводить имена к нижнему регистру
  // filterParticipantInfo: e => ["20", "30"].includes (e.pttype),   // кредитная организация или филиал
  // filterAccounts:        e => e.regulationaccounttype === 'CRSA', // корреспондентский счёт
})

for await (const {bic, namep, adr, account} of reader) {
  // bic     -- БИК
  // account -- кор. счёт
  // namep   -- наименование (филиала) банка
  // adr     -- адрес
    // и теперь можно что-то делать с этими реквизитами...
}

// или, если реализована поточная обработка:

reader.pipe (someObjectWriterStream)
```
