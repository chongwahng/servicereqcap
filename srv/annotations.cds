using {TicketService.Incidents} from './ticket-service';

annotate TicketService.Incidents with @odata.draft.enabled : true;

annotate TicketService.Incidents with {
    ID          @title : '{i18n>ID}'
                @readonly;
    ticket_no   @title : '{i18n>TicketNo}'
                @readonly;
    status      @title : '{i18n>Status}'
                @readonly;
    description @title : '{i18n>Description}';
    createdBy   @title : '{i18n>CreatedBy}';
    createdAt   @title : '{i18n>CreatedAt}';
    modifiedBy  @title : '{i18n>ModifiedBy}';
    modifiedAt  @title : '{i18n>ModifiedAt}';
};

annotate TicketService.Incidents with @UI : {
    HeaderInfo          : {
        TypeName       : '{i18n>Incident}',
        TypeNamePlural : '{i18n>Incidents}',
        Title          : {Value : ticket_no},
        Description    : {Value : description}
    },
    Facets        : [
        {
            $Type  : 'UI.ReferenceFacet',
            Label  : '{i18n>Details}',
            Target : '@UI.FieldGroup#Details'
        },
        {
            $Type  : 'UI.ReferenceFacet',
            Label  : '{i18n>Admin}',
            Target : '@UI.FieldGroup#Admin'
        }
    ],

    FieldGroup #Details : {Data : [
        {Value : ticket_no},
        {Value : status},
        {Value : description}
    ]},
    FieldGroup #Admin   : {Data : [
        {Value : createdBy},
        {Value : createdAt},
        {Value : modifiedBy},
        {Value : modifiedAt}
    ]},
    SelectionFields     : [
        ticket_no,
        status
    ],
    LineItem            : [
        {Value : ticket_no},
        {Value : description},
        {Value : status}
    ]
};
