import React, { FC, useState, useEffect, useContext } from "react";
import { sortBy } from "lodash";
import { Button, Icon, Message, Table } from "semantic-ui-react";
import {
  useNotificateUsersAdminMutation,
  useParametersQuery,
} from "../../../graphql";
import { Flex, Stack } from "@chakra-ui/react";
import { Confirm } from "../../Confirm";
import { whiteSpacePreLine } from "../../../utils/cssConstants";
import { useRememberState } from "use-remember-state";
import { usePagination } from "../Pagination";
import { ResendNotification } from "./resendNotification";
import { ConfigContext } from "../../../context/Config";
import { format } from "date-fns-tz";

export const AdminNotifications: FC<{
  notifications: {
    id: number;
    email: string;
    content: string;
    emailParameters: string;
    date: string;
    counter: number;
  }[];
}> = ({ notifications }) => {
  const config = useContext(ConfigContext);

  const [column, setColumn] = useRememberState(
    "TracAdminNotificationsColumn",
    ""
  );
  const [direction, setDirection] = useRememberState<
    "ascending" | "descending"
  >("TracAdminNotificationsDirection", "ascending");

  const [sortedNotifications, setSortedNotifications] = useRememberState<
    {
      id: number;
      email: string;
      content: string;
      emailParameters: string;
      date: string;
      counter: number;
    }[]
  >("TracAdminSortedNotifications", []);

  useEffect(() => {
    if (direction === "ascending") {
      setSortedNotifications(sortBy(notifications, [column]));
    } else {
      setSortedNotifications(sortBy(notifications, [column]).reverse());
    }
  }, [notifications, column, direction, setSortedNotifications]);

  const handleSort = (clickedColumn: string) => () => {
    if (column !== clickedColumn) {
      setColumn(clickedColumn);
      setDirection("ascending");
    } else {
      setDirection(direction === "ascending" ? "descending" : "ascending");
    }
  };

  const { pagination, selectedData } = usePagination({
    name: "trac_admin_sorted_notifications",
    data: sortedNotifications,
    n: 10,
  });

  const [
    openNotificationMailMessage,
    setOpenNotificationMailMessage,
  ] = useState(false);

  const [
    mailNotificationUsers,
    {
      data: dataNotificationUsers,
      error: errorNotificationUsers,
      loading: loadingNotificationUsers,
    },
  ] = useNotificateUsersAdminMutation();

  const { data: parameters } = useParametersQuery();
  const dateFormatStringTemplate = "dd-MM-yyyy";
  const parameters_date = parameters?.parameters
    ?.map((params) => {
      return {
        id: params.id,
        loading_type: params.loading_type,
        loading_date: format(
          new Date(params.loading_date),
          dateFormatStringTemplate,
          {
            timeZone: "America/Santiago",
          }
        ),
      };
    })
    .reverse();
  const last_loading_date: (
    | { id: number; loading_type: string; loading_date: string }
    | undefined
  )[] = [];
  let types: string[] = [
    "Datos agrupados",
    "Datos empleabilidad",
    "Datos académicos",
    "Datos externos",
  ];
  types.forEach((element) =>
    last_loading_date.push(
      parameters_date?.find((params) => params.loading_type == element)
    )
  );

  return (
    <>
      <Stack alignItems="center" spacing="1pm">
        <Stack mt="10px">
          <Confirm
            header="Are you sure you want to send a Notification email to all users"
            content="It will be sent a Notification about new updates in TrAC-FID data "
          >
            <Button
              color="orange"
              onClick={async () => {
                try {
                  mailNotificationUsers({
                    variables: {
                      header: config.MESSAGE_HEADER,
                      footer: config.MESSAGE_FOOTER,
                      subject: config.MESSAGE_SUBJECT,
                      body: config.DEFAULT_MESSAGE,
                      farewell: config.MESSAGE_FAREWELL,
                      closing: config.MESSAGE_CLOSING,
                      parameters: JSON.stringify(last_loading_date),
                    },
                  });
                  setOpenNotificationMailMessage(true);
                } catch (err) {
                  console.error(JSON.stringify(err, null, 2));
                }
              }}
              loading={loadingNotificationUsers}
              disabled={loadingNotificationUsers}
            >
              <Icon name="mail" />
              Send notification
            </Button>
          </Confirm>
        </Stack>
        {openNotificationMailMessage && (
          <Stack>
            <Message
              success={!errorNotificationUsers ? true : undefined}
              error={!!errorNotificationUsers ? true : undefined}
              icon
              compact
              size="small"
              css={whiteSpacePreLine}
            >
              <Icon
                name="close"
                onClick={() => {
                  setOpenNotificationMailMessage(false);
                }}
              />
              <Message.Content>
                {errorNotificationUsers && (
                  <Message.Header>Error!</Message.Header>
                )}
                {errorNotificationUsers && errorNotificationUsers.message}
                {dataNotificationUsers &&
                dataNotificationUsers.NotificateUsers.length > 0 ? (
                  <Message.List>
                    {dataNotificationUsers.NotificateUsers.length === 0 ? (
                      <Message.Item>
                        {" "}
                        Please use resend notification function, notifications
                        with last parameters date has been sent to all users
                      </Message.Item>
                    ) : (
                      <Message.Item> Done</Message.Item>
                    )}
                  </Message.List>
                ) : (
                  <Message.List>
                    {dataNotificationUsers?.NotificateUsers.length === 0 ? (
                      <Message.Item>
                        {" "}
                        Please use resend notification function, notifications
                        with last parameters date has been sent to all users
                      </Message.Item>
                    ) : (
                      <Message.Item> Notificating</Message.Item>
                    )}
                  </Message.List>
                )}
              </Message.Content>
            </Message>
          </Stack>
        )}
        <Stack mt="10px" alignItems="center">
          <Flex>{pagination}</Flex>
          <Table
            padded
            selectable
            celled
            size="large"
            textAlign="center"
            sortable
          >
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell
                  sorted={column === "id" ? direction : undefined}
                  onClick={handleSort("id")}
                >
                  id
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={column === "email" ? direction : undefined}
                  onClick={handleSort("email")}
                >
                  email
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={column === "content" ? direction : undefined}
                  onClick={handleSort("content")}
                >
                  content
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={column === "date" ? direction : undefined}
                  onClick={handleSort("date")}
                >
                  parameters date notified
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={column === "parameters" ? direction : undefined}
                  onClick={handleSort("parameters")}
                >
                  send date
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={column === "counter" ? direction : undefined}
                  onClick={handleSort("counter")}
                >
                  send counter
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {selectedData.map(
                (
                  { id, email, content, date, emailParameters, counter },
                  key
                ) => {
                  const data = JSON.parse(content);
                  const parametersData = JSON.parse(emailParameters);
                  console.log(parametersData);
                  const messageDate = format(
                    new Date(date),
                    dateFormatStringTemplate,
                    {
                      timeZone: "America/Santiago",
                    }
                  );
                  return (
                    <ResendNotification
                      key={key}
                      notification={{
                        id: id,
                        email: email,
                        content: content,
                        parameters: JSON.stringify(parametersData),
                        counter: counter,
                      }}
                    >
                      <Table.Row className="cursorPointer">
                        <Table.Cell>{id}</Table.Cell>
                        <Table.Cell>{email} </Table.Cell>
                        <Table.Cell>
                          <p>
                            <b>Subject: </b> {data.subject}
                          </p>
                          <p>
                            <b>Header: </b> {data.header}
                          </p>
                          <p>
                            <b>Body: </b> {data.body}
                          </p>
                          <b>Farewell: </b> {data.farewell}
                          <p>
                            <b>Closing: </b> {data.closing}{" "}
                            soportelala@inf.uach.cl
                          </p>
                          <p>
                            <b>Footer</b>:{data.footer}
                            {email}
                          </p>
                        </Table.Cell>
                        <Table.Cell>
                          <p>
                            {" "}
                            <b>{parametersData[0].loading_type} </b>:{" "}
                          </p>
                          {parametersData[0].loading_date}

                          <p>
                            {" "}
                            <b>{parametersData[1].loading_type} </b>:{" "}
                          </p>
                          {parametersData[1].loading_date}
                          <p>
                            {" "}
                            <b>{parametersData[2].loading_type} </b>:{" "}
                          </p>
                          {parametersData[2].loading_date}
                          <p>
                            {" "}
                            <b>{parametersData[3].loading_type} </b>:{" "}
                          </p>
                          {parametersData[3].loading_date}
                        </Table.Cell>
                        <Table.Cell>{messageDate}</Table.Cell>
                        <Table.Cell>{counter}</Table.Cell>
                      </Table.Row>
                    </ResendNotification>
                  );
                }
              )}
            </Table.Body>
          </Table>
        </Stack>
      </Stack>
    </>
  );
};
